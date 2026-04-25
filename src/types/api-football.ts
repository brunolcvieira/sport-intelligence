// Raw API-Football v3 response shapes

export interface APIResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

// ── Fixture ────────────────────────────────────────────────────────────────
export interface APIFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

// ── Standings ─────────────────────────────────────────────────────────────
export interface APIStandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    standings: APIStandingEntry[][];
  };
}

export interface APIStandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: APIStatBlock;
  home: APIStatBlock;
  away: APIStatBlock;
  update: string;
}

export interface APIStatBlock {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

// ── Team Statistics ────────────────────────────────────────────────────────
export interface APITeamStats {
  league: { id: number; name: string; country: string; season: number };
  team: { id: number; name: string; logo: string };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
    against: { average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
  };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
}

// ── Head to Head ─────────────────────────────────────────────────────────
export interface APIH2H {
  fixture: APIFixture["fixture"];
  league: APIFixture["league"];
  teams: APIFixture["teams"];
  goals: APIFixture["goals"];
}
