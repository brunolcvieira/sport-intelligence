import { prisma } from "@/lib/prisma";
import { fetchStandings } from "@/lib/api-football";
import type { APIStandingEntry } from "@/types/api-football";

export async function fetchAndSaveStandings(leagueId: number, season: number) {
  const response = await fetchStandings(leagueId, season);
  const leagueData = response.response[0]?.league;
  if (!leagueData) return 0;

  const entries = leagueData.standings.flat();
  let saved = 0;

  for (const entry of entries) {
    await upsertStanding(leagueId, season, entry);
    saved++;
  }

  return saved;
}

async function upsertStanding(leagueId: number, season: number, e: APIStandingEntry) {
  const data = {
    rank: e.rank,
    points: e.points,
    played: e.all.played,
    wins: e.all.win,
    draws: e.all.draw,
    losses: e.all.lose,
    goalsFor: e.all.goals.for,
    goalsAgainst: e.all.goals.against,
    goalDiff: e.goalsDiff,
    homeWins: e.home.win,
    homeDraws: e.home.draw,
    homeLosses: e.home.lose,
    homeFor: e.home.goals.for,
    homeAgainst: e.home.goals.against,
    awayWins: e.away.win,
    awayDraws: e.away.draw,
    awayLosses: e.away.lose,
    awayFor: e.away.goals.for,
    awayAgainst: e.away.goals.against,
    form: e.form,
  };

  await prisma.standing.upsert({
    where: { leagueId_teamId_season: { leagueId, teamId: e.team.id, season } },
    update: data,
    create: { leagueId, teamId: e.team.id, season, ...data },
  });
}

export async function getStanding(teamId: number, leagueId: number, season: number) {
  return prisma.standing.findUnique({
    where: { leagueId_teamId_season: { leagueId, teamId, season } },
  });
}

export async function getLeagueStandings(leagueId: number, season: number) {
  return prisma.standing.findMany({
    where: { leagueId, season },
    include: { team: true },
    orderBy: { rank: "asc" },
  });
}
