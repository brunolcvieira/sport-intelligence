// Internal domain types for analysis engine

export type ConfidenceLevel = "low" | "medium" | "high";
export type DrawTendency = "low" | "medium" | "high";
export type Favorite = "home" | "away" | "draw";

// ── Competitive Context ────────────────────────────────────────────────────
export type CompetitiveObjective =
  | "title_race"
  | "continental_spot"
  | "top_half_push"
  | "mid_table"
  | "relegation_battle"
  | "already_relegated"
  | "no_objective";

export interface CompetitiveContext {
  objective: CompetitiveObjective
  objectiveLabel: string
  ptsToLeader: number
  ptsToTop4: number
  ptsToRelegation: number
  rank: number
  totalTeams: number
  isDecisive: boolean
  motivationScore: number // 0-100
}

// ── Team Snapshot ─────────────────────────────────────────────────────────
export interface TeamSnapshot {
  id: number
  name: string
  logo: string
  rank: number
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  homeWins: number
  homeDraws: number
  homeLosses: number
  homeGoalsFor: number
  homeGoalsAgainst: number
  awayWins: number
  awayDraws: number
  awayLosses: number
  awayGoalsFor: number
  awayGoalsAgainst: number
  form: string           // "WWDLW"
  avgGoalsFor: number
  avgGoalsAgainst: number
  cleanSheets: number
  failedToScore: number
  last5: FormEntry[]
}

export interface FormEntry {
  result: "W" | "D" | "L"
  goalsFor: number
  goalsAgainst: number
}

// ── Scoring breakdown ─────────────────────────────────────────────────────
export interface ScoreBreakdown {
  tablePosition: number    // 0-20
  recentForm: number       // 0-20
  fieldAdvantage: number   // 0-15 (home) or 0 (away)
  attackStrength: number   // 0-15
  defenseStrength: number  // 0-15
  motivation: number       // 0-10
  h2h: number              // 0-5
  total: number            // 0-100 (raw, before normalisation)
}

// ── Match Analysis ────────────────────────────────────────────────────────
export interface MatchAnalysisResult {
  fixtureId: number
  homeTeam: TeamSnapshot
  awayTeam: TeamSnapshot
  homeScore: number
  awayScore: number
  homeScoreBreakdown: ScoreBreakdown
  awayScoreBreakdown: ScoreBreakdown
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  favorite: Favorite
  confidence: ConfidenceLevel
  drawTendency: DrawTendency
  drawTendencyFactors: string[]
  homeContext: CompetitiveContext
  awayContext: CompetitiveContext
  textSummary: string
  alerts: string[]
}

// ── H2H Summary ───────────────────────────────────────────────────────────
export interface H2HSummary {
  totalGames: number
  homeWins: number
  draws: number
  awayWins: number
  homeWinRate: number
  drawRate: number
  awayWinRate: number
  avgGoals: number
}
