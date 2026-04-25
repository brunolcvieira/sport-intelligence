import { prisma } from "@/lib/prisma";
import { fetchTeamStats, fetchH2H } from "@/lib/api-football";
import type { TeamSnapshot, FormEntry, H2HSummary } from "@/types/analysis";
import type { Prisma } from "@prisma/client";

type StandingWithTeam = Prisma.StandingGetPayload<{ include: { team: true } }>;

export async function buildTeamSnapshot(
  standing: StandingWithTeam,
  leagueId: number,
  season: number
): Promise<TeamSnapshot> {
  let avgGoalsFor = standing.played > 0 ? standing.goalsFor / standing.played : 0;
  let avgGoalsAgainst = standing.played > 0 ? standing.goalsAgainst / standing.played : 0;
  let cleanSheets = 0;
  let failedToScore = 0;
  let last5: FormEntry[] = [];

  try {
    const statsRes = await fetchTeamStats(standing.teamId, leagueId, season);
    const stats = statsRes.response[0];

    if (stats) {
      avgGoalsFor = parseFloat(stats.goals.for.average.total) || avgGoalsFor;
      avgGoalsAgainst = parseFloat(stats.goals.against.average.total) || avgGoalsAgainst;
      cleanSheets = stats.clean_sheet.total;
      failedToScore = stats.failed_to_score.total;

      const formStr = stats.form ?? standing.form ?? "";
      last5 = formStr
        .slice(-5)
        .split("")
        .map((r) => ({ result: r as "W" | "D" | "L", goalsFor: 0, goalsAgainst: 0 }));
    }
  } catch {
    // fallback to DB data
    const formStr = standing.form ?? "";
    last5 = formStr
      .slice(-5)
      .split("")
      .map((r) => ({ result: r as "W" | "D" | "L", goalsFor: 0, goalsAgainst: 0 }));
  }

  await prisma.teamForm.upsert({
    where: { teamId_leagueId_season: { teamId: standing.teamId, leagueId, season } },
    update: { last5: JSON.stringify(last5), avgGoalsFor, avgGoalsAgainst, winRate5: calcWinRate(last5) },
    create: { teamId: standing.teamId, leagueId, season, last5: JSON.stringify(last5), avgGoalsFor, avgGoalsAgainst, winRate5: calcWinRate(last5) },
  });

  return {
    id: standing.teamId,
    name: standing.team.name,
    logo: standing.team.logo ?? "",
    rank: standing.rank,
    points: standing.points,
    played: standing.played,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    goalDiff: standing.goalDiff,
    homeWins: standing.homeWins,
    homeDraws: standing.homeDraws,
    homeLosses: standing.homeLosses,
    homeGoalsFor: standing.homeFor,
    homeGoalsAgainst: standing.homeAgainst,
    awayWins: standing.awayWins,
    awayDraws: standing.awayDraws,
    awayLosses: standing.awayLosses,
    awayGoalsFor: standing.awayFor,
    awayGoalsAgainst: standing.awayAgainst,
    form: standing.form ?? "",
    avgGoalsFor,
    avgGoalsAgainst,
    cleanSheets,
    failedToScore,
    last5,
  };
}

export async function buildH2HSummary(homeId: number, awayId: number): Promise<H2HSummary> {
  try {
    const res = await fetchH2H(homeId, awayId, 10);
    const games = res.response;

    if (!games.length) return emptyH2H();

    let homeWins = 0, draws = 0, awayWins = 0, totalGoals = 0;

    for (const g of games) {
      const hg = g.goals.home ?? 0;
      const ag = g.goals.away ?? 0;
      totalGoals += hg + ag;

      if (g.teams.home.id === homeId) {
        if (hg > ag) homeWins++;
        else if (hg === ag) draws++;
        else awayWins++;
      } else {
        if (ag > hg) homeWins++;
        else if (hg === ag) draws++;
        else awayWins++;
      }
    }

    const total = games.length;
    return {
      totalGames: total,
      homeWins,
      draws,
      awayWins,
      homeWinRate: homeWins / total,
      drawRate: draws / total,
      awayWinRate: awayWins / total,
      avgGoals: totalGoals / total,
    };
  } catch {
    return emptyH2H();
  }
}

function emptyH2H(): H2HSummary {
  return { totalGames: 0, homeWins: 0, draws: 0, awayWins: 0, homeWinRate: 0, drawRate: 0, awayWinRate: 0, avgGoals: 0 };
}

function calcWinRate(last5: FormEntry[]): number {
  if (!last5.length) return 0;
  return last5.filter((e) => e.result === "W").length / last5.length;
}
