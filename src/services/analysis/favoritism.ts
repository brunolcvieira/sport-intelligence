import type { TeamSnapshot, CompetitiveContext, ScoreBreakdown, Favorite, ConfidenceLevel } from "@/types/analysis";
import type { H2HSummary } from "@/types/analysis";
import { clamp } from "@/lib/utils";

// Weights must sum to 100
const WEIGHTS = {
  tablePosition: 20,
  recentForm: 20,
  fieldAdvantage: 15, // only home team gets this
  attack: 15,
  defense: 15,
  motivation: 10,
  h2h: 5,
} as const;

export interface FavoritismResult {
  homeScore: number;
  awayScore: number;
  homeBreakdown: ScoreBreakdown;
  awayBreakdown: ScoreBreakdown;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  favorite: Favorite;
  confidence: ConfidenceLevel;
}

export function calculateFavoritism(
  home: TeamSnapshot,
  away: TeamSnapshot,
  homeCtx: CompetitiveContext,
  awayCtx: CompetitiveContext,
  h2h: H2HSummary,
  totalTeams = 20
): FavoritismResult {
  const homeBreakdown = buildScoreBreakdown(home, away, homeCtx, h2h, true, totalTeams);
  const awayBreakdown = buildScoreBreakdown(away, home, awayCtx, h2h, false, totalTeams);

  // Normalise to 0-100
  const rawHome = homeBreakdown.total;
  const rawAway = awayBreakdown.total;
  const rawTotal = rawHome + rawAway;

  // Derived probabilities using Poisson-inspired scaling
  const homeStrength = rawHome / rawTotal;
  const awayStrength = rawAway / rawTotal;

  // Base probs with inherent draw probability
  const baseHomeWin = homeStrength * 0.72;
  const baseAwayWin = awayStrength * 0.72;
  const baseDraw = 1 - baseHomeWin - baseAwayWin;

  const homeWinPct = Math.round(clamp(baseHomeWin, 0.05, 0.85) * 100);
  const awayWinPct = Math.round(clamp(baseAwayWin, 0.05, 0.85) * 100);
  const drawPct = 100 - homeWinPct - awayWinPct;

  const favorite = pickFavorite(homeWinPct, drawPct, awayWinPct);
  const confidence = assessConfidence(homeWinPct, awayWinPct, home, away);

  return {
    homeScore: Math.round(rawHome),
    awayScore: Math.round(rawAway),
    homeBreakdown,
    awayBreakdown,
    homeWinPct,
    drawPct: Math.max(5, drawPct),
    awayWinPct,
    favorite,
    confidence,
  };
}

function buildScoreBreakdown(
  team: TeamSnapshot,
  opponent: TeamSnapshot,
  ctx: CompetitiveContext,
  h2h: H2HSummary,
  isHome: boolean,
  totalTeams: number
): ScoreBreakdown {
  // 1. Table position (20 pts max) — inverted rank
  const tablePosition = Math.round(
    ((totalTeams - team.rank + 1) / totalTeams) * WEIGHTS.tablePosition
  );

  // 2. Recent form (20 pts max) — last 5 results
  const formStr = team.form.slice(-5);
  const formPoints = formStr.split("").reduce((acc, r) => {
    if (r === "W") return acc + 3;
    if (r === "D") return acc + 1;
    return acc;
  }, 0);
  const recentForm = Math.round((formPoints / 15) * WEIGHTS.recentForm);

  // 3. Field advantage (15 pts) — only home team
  const homeRecord = isHome
    ? team.homeWins / Math.max(1, team.homeWins + team.homeDraws + team.homeLosses)
    : 0;
  const fieldAdvantage = Math.round(homeRecord * WEIGHTS.fieldAdvantage);

  // 4. Attack (15 pts) — avg goals scored vs opponent avg conceded
  const attackRatio = clamp(
    team.avgGoalsFor / Math.max(0.5, opponent.avgGoalsAgainst),
    0,
    3
  );
  const attack = Math.round((attackRatio / 3) * WEIGHTS.attack);

  // 5. Defense (15 pts) — low avg goals conceded = stronger defense
  const maxAvg = 3;
  const defenseScore = clamp(1 - team.avgGoalsAgainst / maxAvg, 0, 1);
  const defense = Math.round(defenseScore * WEIGHTS.defense);

  // 6. Motivation (10 pts)
  const motivation = Math.round((ctx.motivationScore / 100) * WEIGHTS.motivation);

  // 7. H2H (5 pts)
  let h2hScore = 0;
  if (h2h.totalGames >= 3) {
    const rate = isHome ? h2h.homeWinRate : h2h.awayWinRate;
    h2hScore = Math.round(rate * WEIGHTS.h2h);
  } else {
    h2hScore = Math.round(0.4 * WEIGHTS.h2h); // neutral when no data
  }

  const total = tablePosition + recentForm + fieldAdvantage + attack + defense + motivation + h2hScore;

  return { tablePosition, recentForm, fieldAdvantage, attackStrength: attack, defenseStrength: defense, motivation, h2h: h2hScore, total };
}

function pickFavorite(homeWin: number, draw: number, awayWin: number): Favorite {
  if (homeWin >= draw && homeWin >= awayWin) return "home";
  if (awayWin >= homeWin && awayWin >= draw) return "away";
  return "draw";
}

function assessConfidence(
  homeWin: number,
  awayWin: number,
  home: TeamSnapshot,
  away: TeamSnapshot
): ConfidenceLevel {
  const gap = Math.abs(homeWin - awayWin);
  const rankGap = Math.abs(home.rank - away.rank);

  if (gap >= 25 && rankGap >= 5) return "high";
  if (gap >= 12 || rankGap >= 3) return "medium";
  return "low";
}
