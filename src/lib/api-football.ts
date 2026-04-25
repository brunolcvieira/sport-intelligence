import axios, { AxiosInstance } from "axios";
import type {
  APIResponse,
  APIFixture,
  APIStandingsResponse,
  APITeamStats,
  APIH2H,
} from "@/types/api-football";

const BASE_URL = "https://v3.football.api-sports.io";

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
    timeout: 15_000,
  });
}

const client = createClient();

// ── Rate-limit aware wrapper ──────────────────────────────────────────────
async function get<T>(path: string, params: Record<string, string | number>) {
  const res = await client.get<APIResponse<T>>(path, { params });
  const data = res.data;

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
  }

  return data;
}

// ── Fixtures ──────────────────────────────────────────────────────────────
export async function fetchFixturesByDate(date: string, timezone = "America/Sao_Paulo") {
  return get<APIFixture>("/fixtures", { date, timezone });
}

export async function fetchFixturesByLeagueDate(
  leagueId: number,
  season: number,
  date: string
) {
  return get<APIFixture>("/fixtures", { league: leagueId, season, date });
}

// ── Standings ─────────────────────────────────────────────────────────────
export async function fetchStandings(leagueId: number, season: number) {
  return get<APIStandingsResponse>("/standings", { league: leagueId, season });
}

// ── Team statistics ───────────────────────────────────────────────────────
export async function fetchTeamStats(teamId: number, leagueId: number, season: number) {
  return get<APITeamStats>("/teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  });
}

// ── Head to Head ──────────────────────────────────────────────────────────
export async function fetchH2H(homeId: number, awayId: number, last = 10) {
  return get<APIH2H>("/fixtures/headtohead", {
    h2h: `${homeId}-${awayId}`,
    last,
  });
}

// ── Leagues ───────────────────────────────────────────────────────────────
export async function fetchCurrentSeason(leagueId: number) {
  const res = await get<{ league: { id: number; seasons: { year: number; current: boolean }[] } }>(
    "/leagues",
    { id: leagueId }
  );
  const league = res.response[0]?.league;
  if (!league) return null;
  return league.seasons.find((s) => s.current)?.year ?? null;
}
