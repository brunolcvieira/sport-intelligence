import { prisma } from "@/lib/prisma";
import { fetchAndSaveFixtures, getFixturesForDate, PRIORITY_LEAGUES } from "@/services/football/fixtures";
import { fetchAndSaveStandings, getLeagueStandings } from "@/services/football/standings";
import { buildTeamSnapshot, buildH2HSummary } from "@/services/football/teams";
import { detectCompetitiveContext } from "@/services/analysis/competitive-context";
import { calculateFavoritism } from "@/services/analysis/favoritism";
import { detectDrawTendency } from "@/services/analysis/draw-tendency";
import { generateTextSummary, buildAlerts } from "@/services/analysis/text-generator";
import { todayISO, sleep } from "@/lib/utils";
import type { MatchAnalysisResult } from "@/types/analysis";

export async function runDailyAnalysis(date?: string): Promise<{
  date: string;
  total: number;
  analysed: number;
  errors: string[];
  durationMs: number;
}> {
  const targetDate = date ?? todayISO();
  const start = Date.now();
  const errors: string[] = [];

  // 1. Create/update DailyReport
  const report = await prisma.dailyReport.upsert({
    where: { date: new Date(targetDate) },
    update: { status: "running" },
    create: { date: new Date(targetDate), status: "running" },
  });

  try {
    // 2. Fetch and save fixtures
    const total = await fetchAndSaveFixtures(targetDate);

    // 3. Update standings for each unique league
    const fixtures = await getFixturesForDate(targetDate);
    const leagueIds = [...new Set(fixtures.map((f) => f.leagueId))];

    for (const leagueId of leagueIds) {
      const season = fixtures.find((f) => f.leagueId === leagueId)?.season ?? 2025;
      try {
        await fetchAndSaveStandings(leagueId, season);
        await sleep(300); // respect rate limits
      } catch (e) {
        errors.push(`Standings league ${leagueId}: ${String(e)}`);
      }
    }

    // 4. Analyse each fixture
    let analysed = 0;

    for (const fixture of fixtures) {
      try {
        const result = await analyseFixture(fixture.id, fixture.leagueId, fixture.season);
        if (result) analysed++;
        await sleep(400);
      } catch (e) {
        errors.push(`Fixture ${fixture.id}: ${String(e)}`);
      }
    }

    const durationMs = Date.now() - start;

    await prisma.dailyReport.update({
      where: { id: report.id },
      data: { status: "done", totalFixtures: total, analysed, executionMs: durationMs },
    });

    return { date: targetDate, total, analysed, errors, durationMs };
  } catch (e) {
    await prisma.dailyReport.update({
      where: { id: report.id },
      data: { status: "error", errorMsg: String(e) },
    });
    throw e;
  }
}

export async function analyseFixture(
  fixtureId: number,
  leagueId: number,
  season: number
): Promise<MatchAnalysisResult | null> {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { homeTeam: true, awayTeam: true, league: true },
  });

  if (!fixture) return null;

  // Get standings
  const allStandings = await getLeagueStandings(leagueId, season);
  const homeStanding = allStandings.find((s) => s.teamId === fixture.homeTeamId);
  const awayStanding = allStandings.find((s) => s.teamId === fixture.awayTeamId);

  if (!homeStanding || !awayStanding) return null;

  const [homeSnap, awaySnap] = await Promise.all([
    buildTeamSnapshot(homeStanding, leagueId, season),
    buildTeamSnapshot(awayStanding, leagueId, season),
  ]);

  const allSnaps = allStandings.map((s) => ({
    ...s,
    form: s.form ?? "",
    avgGoalsFor: 0,
    avgGoalsAgainst: 0,
    cleanSheets: 0,
    failedToScore: 0,
    last5: [],
    homeGoalsFor: s.homeFor,
    homeGoalsAgainst: s.homeAgainst,
    awayGoalsFor: s.awayFor,
    awayGoalsAgainst: s.awayAgainst,
    logo: s.team.logo ?? "",
    shortName: s.team.shortName,
    country: s.team.country,
    name: s.team.name,
    id: s.teamId,
  }));

  const totalTeams = allStandings.length;

  const homeCtx = detectCompetitiveContext(homeSnap, allSnaps, { totalTeams });
  const awayCtx = detectCompetitiveContext(awaySnap, allSnaps, { totalTeams });

  const h2h = await buildH2HSummary(fixture.homeTeamId, fixture.awayTeamId);

  const fav = calculateFavoritism(homeSnap, awaySnap, homeCtx, awayCtx, h2h, totalTeams);

  const drawResult = detectDrawTendency(
    homeSnap,
    awaySnap,
    homeCtx,
    awayCtx,
    h2h,
    Math.abs(fav.homeScore - fav.awayScore)
  );

  const partial: Omit<MatchAnalysisResult, "textSummary" | "alerts"> = {
    fixtureId,
    homeTeam: homeSnap,
    awayTeam: awaySnap,
    homeScore: fav.homeScore,
    awayScore: fav.awayScore,
    homeScoreBreakdown: fav.homeBreakdown,
    awayScoreBreakdown: fav.awayBreakdown,
    homeWinPct: fav.homeWinPct,
    drawPct: fav.drawPct,
    awayWinPct: fav.awayWinPct,
    favorite: fav.favorite,
    confidence: fav.confidence,
    drawTendency: drawResult.tendency,
    drawTendencyFactors: drawResult.factors,
    homeContext: homeCtx,
    awayContext: awayCtx,
  };

  const alerts = buildAlerts(partial);
  const result: MatchAnalysisResult = { ...partial, alerts, textSummary: "" };
  result.textSummary = await generateTextSummary(result);

  // Persist
  await prisma.matchAnalysis.upsert({
    where: { fixtureId },
    update: {
      homeScore: fav.homeScore,
      awayScore: fav.awayScore,
      homeWinPct: fav.homeWinPct,
      drawPct: fav.drawPct,
      awayWinPct: fav.awayWinPct,
      favorite: fav.favorite,
      confidence: fav.confidence,
      drawTendency: drawResult.tendency,
      homeContext: JSON.stringify(homeCtx),
      awayContext: JSON.stringify(awayCtx),
      textSummary: result.textSummary,
      rawData: result as object,
    },
    create: {
      fixtureId,
      homeScore: fav.homeScore,
      awayScore: fav.awayScore,
      homeWinPct: fav.homeWinPct,
      drawPct: fav.drawPct,
      awayWinPct: fav.awayWinPct,
      favorite: fav.favorite,
      confidence: fav.confidence,
      drawTendency: drawResult.tendency,
      homeContext: JSON.stringify(homeCtx),
      awayContext: JSON.stringify(awayCtx),
      textSummary: result.textSummary,
      rawData: result as object,
    },
  });

  return result;
}
