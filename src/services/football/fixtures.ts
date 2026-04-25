import { prisma } from "@/lib/prisma";
import { fetchFixturesByDate } from "@/lib/api-football";
import { todayISO } from "@/lib/utils";
import type { APIFixture } from "@/types/api-football";

// Priority leagues (expand as needed)
export const PRIORITY_LEAGUES: Record<number, string> = {
  71:  "Brasileirão Série A",
  72:  "Brasileirão Série B",
  39:  "Premier League",
  140: "La Liga",
  135: "Serie A",
  78:  "Bundesliga",
  61:  "Ligue 1",
  2:   "Champions League",
  3:   "Europa League",
  848: "Conference League",
};

export async function fetchAndSaveFixtures(date?: string): Promise<number> {
  const targetDate = date ?? todayISO();
  const response = await fetchFixturesByDate(targetDate);

  const fixtures = response.response.filter(
    (f) => PRIORITY_LEAGUES[f.league.id]
  );

  let saved = 0;

  for (const f of fixtures) {
    await upsertLeague(f);
    await upsertTeams(f);
    await upsertFixture(f);
    saved++;
  }

  return saved;
}

async function upsertLeague(f: APIFixture) {
  await prisma.league.upsert({
    where: { id: f.league.id },
    update: { name: f.league.name, country: f.league.country, logo: f.league.logo, season: f.league.season },
    create: { id: f.league.id, name: f.league.name, country: f.league.country, logo: f.league.logo, season: f.league.season },
  });
}

async function upsertTeams(f: APIFixture) {
  await prisma.team.upsert({
    where: { id: f.teams.home.id },
    update: { name: f.teams.home.name, logo: f.teams.home.logo },
    create: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
  });
  await prisma.team.upsert({
    where: { id: f.teams.away.id },
    update: { name: f.teams.away.name, logo: f.teams.away.logo },
    create: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
  });
}

async function upsertFixture(f: APIFixture) {
  await prisma.fixture.upsert({
    where: { id: f.fixture.id },
    update: {
      status: f.fixture.status.short,
      homeGoals: f.goals.home,
      awayGoals: f.goals.away,
    },
    create: {
      id: f.fixture.id,
      date: new Date(f.fixture.date),
      status: f.fixture.status.short,
      homeTeamId: f.teams.home.id,
      awayTeamId: f.teams.away.id,
      leagueId: f.league.id,
      homeGoals: f.goals.home,
      awayGoals: f.goals.away,
      venue: f.fixture.venue.name ?? undefined,
      round: f.league.round,
      season: f.league.season,
    },
  });
}

export async function getFixturesForDate(date?: string) {
  const targetDate = date ?? todayISO();
  const start = new Date(`${targetDate}T00:00:00.000Z`);
  const end = new Date(`${targetDate}T23:59:59.999Z`);

  return prisma.fixture.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true,
      analysis: true,
    },
    orderBy: { date: "asc" },
  });
}
