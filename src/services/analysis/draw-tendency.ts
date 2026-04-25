import type { TeamSnapshot, CompetitiveContext, DrawTendency } from "@/types/analysis";
import type { H2HSummary } from "@/types/analysis";

export interface DrawTendencyResult {
  tendency: DrawTendency;
  score: number; // 0-100
  factors: string[];
}

export function detectDrawTendency(
  home: TeamSnapshot,
  away: TeamSnapshot,
  homeCtx: CompetitiveContext,
  awayCtx: CompetitiveContext,
  h2h: H2HSummary,
  scoreGap: number // absolute difference between favoritism scores
): DrawTendencyResult {
  let score = 0;
  const factors: string[] = [];

  // 1. Balanced strength (score gap < 8) — max 30 pts
  if (scoreGap < 5) {
    score += 30;
    factors.push("Times muito equilibrados em termos de força");
  } else if (scoreGap < 8) {
    score += 20;
    factors.push("Equilíbrio técnico elevado entre as equipes");
  } else if (scoreGap < 12) {
    score += 10;
  }

  // 2. Draw-prone teams — max 25 pts
  const homeDrawRate = home.draws / Math.max(1, home.played);
  const awayDrawRate = away.draws / Math.max(1, away.played);
  const avgDrawRate = (homeDrawRate + awayDrawRate) / 2;

  if (avgDrawRate >= 0.35) {
    score += 25;
    factors.push("Ambos os times empatiram frequentemente na temporada");
  } else if (avgDrawRate >= 0.28) {
    score += 15;
    factors.push("Histórico de empates moderado nas duas equipes");
  } else if (avgDrawRate >= 0.2) {
    score += 7;
  }

  // 3. Low-scoring teams — max 20 pts
  const avgGoalsPerGame = (home.avgGoalsFor + away.avgGoalsFor) / 2;
  if (avgGoalsPerGame < 1.1) {
    score += 20;
    factors.push("Médias ofensivas baixas — jogo tende a ser de poucos gols");
  } else if (avgGoalsPerGame < 1.4) {
    score += 12;
    factors.push("Ataques moderados, jogo pode ser truncado");
  }

  // 4. High pressure from both sides (neither can afford to lose) — max 15 pts
  const bothUnderPressure =
    homeCtx.objective === "relegation_battle" && awayCtx.objective === "relegation_battle";
  const bothNeedResult =
    (homeCtx.objective === "title_race" || homeCtx.objective === "continental_spot") &&
    (awayCtx.objective === "title_race" || awayCtx.objective === "continental_spot");

  if (bothUnderPressure || bothNeedResult) {
    score += 15;
    factors.push("Ambas as equipes sob alta pressão — tendência a jogo mais fechado");
  }

  // 5. Both can accept a draw (neither team has strong motivation to attack) — max 10 pts
  const bothMidTable =
    homeCtx.objective === "mid_table" && awayCtx.objective === "mid_table";
  if (bothMidTable) {
    score += 10;
    factors.push("Times de meio de tabela — pressão ofensiva reduzida");
  }

  // 6. H2H draw history — max 10 pts
  if (h2h.totalGames >= 5 && h2h.drawRate >= 0.4) {
    score += 10;
    factors.push(`Confronto direto tem histórico de empates (${Math.round(h2h.drawRate * 100)}%)`);
  } else if (h2h.totalGames >= 3 && h2h.drawRate >= 0.3) {
    score += 5;
  }

  // Defensive form bonus — max 5 pts
  const homeCleanSheetRate = home.cleanSheets / Math.max(1, home.played);
  const awayCleanSheetRate = away.cleanSheets / Math.max(1, away.played);
  if (homeCleanSheetRate >= 0.35 && awayCleanSheetRate >= 0.35) {
    score += 5;
    factors.push("Ambas as defesas têm boa taxa de clean sheet");
  }

  const clampedScore = Math.min(100, score);
  const tendency: DrawTendency =
    clampedScore >= 60 ? "high" : clampedScore >= 35 ? "medium" : "low";

  return { tendency, score: clampedScore, factors };
}
