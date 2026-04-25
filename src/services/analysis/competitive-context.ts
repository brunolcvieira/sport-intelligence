import type { TeamSnapshot, CompetitiveContext, CompetitiveObjective } from "@/types/analysis";
import { clamp } from "@/lib/utils";

interface LeagueMeta {
  totalTeams: number;
  relegationZone: number;   // bottom N teams go down
  continentalSpots: number; // top N get continental
  titleSpots: number;       // usually 1
  roundsPlayed: number;
  totalRounds: number;
}

const DEFAULT_META: LeagueMeta = {
  totalTeams: 20,
  relegationZone: 3,
  continentalSpots: 6,
  titleSpots: 1,
  roundsPlayed: 20,
  totalRounds: 38,
};

export function detectCompetitiveContext(
  team: TeamSnapshot,
  allStandings: TeamSnapshot[],
  meta: Partial<LeagueMeta> = {}
): CompetitiveContext {
  const m: LeagueMeta = { ...DEFAULT_META, ...meta };
  const sorted = [...allStandings].sort((a, b) => a.rank - b.rank);
  const totalTeams = sorted.length || m.totalTeams;
  const leader = sorted[0];
  const top4 = sorted[m.continentalSpots - 1];
  const relegationCutoff = sorted[totalTeams - m.relegationZone - 1];

  const ptsToLeader = leader ? Math.max(0, leader.points - team.points) : 0;
  const ptsToTop4 = top4 ? Math.max(0, top4.points - team.points) : 0;
  const ptsToRelegation = relegationCutoff ? team.points - relegationCutoff.points : 0;

  const roundsLeft = m.totalRounds - m.roundsPlayed;
  const maxPossiblePts = roundsLeft * 3;

  const objective = classifyObjective(team.rank, totalTeams, ptsToLeader, ptsToTop4, ptsToRelegation, maxPossiblePts, m);

  const isDecisive = detectDecisive(objective, ptsToLeader, ptsToTop4, ptsToRelegation, roundsLeft);
  const motivationScore = calcMotivationScore(objective, isDecisive, ptsToRelegation, ptsToLeader, roundsLeft);

  return {
    objective,
    objectiveLabel: OBJECTIVE_LABELS[objective],
    ptsToLeader,
    ptsToTop4,
    ptsToRelegation,
    rank: team.rank,
    totalTeams,
    isDecisive,
    motivationScore,
  };
}

function classifyObjective(
  rank: number,
  totalTeams: number,
  ptsToLeader: number,
  ptsToTop4: number,
  ptsToRelegation: number,
  maxPts: number,
  m: LeagueMeta
): CompetitiveObjective {
  const inRelegationZone = rank > totalTeams - m.relegationZone;
  const justAboveRelegation = ptsToRelegation >= 0 && ptsToRelegation <= 5;

  if (inRelegationZone) {
    if (maxPts === 0) return "already_relegated";
    return "relegation_battle";
  }
  if (justAboveRelegation) return "relegation_battle";
  if (rank === 1 || (ptsToLeader <= 5 && ptsToLeader <= maxPts)) return "title_race";
  if (rank <= m.continentalSpots || (ptsToTop4 <= 5 && ptsToTop4 <= maxPts)) return "continental_spot";
  if (rank <= m.continentalSpots + 3) return "top_half_push";
  if (maxPts === 0) return "no_objective";
  return "mid_table";
}

function detectDecisive(
  obj: CompetitiveObjective,
  ptsToLeader: number,
  ptsToTop4: number,
  ptsToRelegation: number,
  roundsLeft: number
): boolean {
  if (roundsLeft > 10) return false;
  if (obj === "title_race" && ptsToLeader <= 6) return true;
  if (obj === "continental_spot" && ptsToTop4 <= 6) return true;
  if (obj === "relegation_battle" && Math.abs(ptsToRelegation) <= 6) return true;
  return false;
}

function calcMotivationScore(
  obj: CompetitiveObjective,
  isDecisive: boolean,
  ptsToRelegation: number,
  ptsToLeader: number,
  roundsLeft: number
): number {
  const base: Record<CompetitiveObjective, number> = {
    title_race: 90,
    continental_spot: 80,
    top_half_push: 65,
    mid_table: 40,
    relegation_battle: 85,
    already_relegated: 15,
    no_objective: 20,
  };

  let score = base[obj];

  if (isDecisive) score = Math.min(100, score + 10);

  // Close margins increase motivation
  if (obj === "relegation_battle" && ptsToRelegation <= 3) score = Math.min(100, score + 8);
  if (obj === "title_race" && ptsToLeader <= 3) score = Math.min(100, score + 8);

  // Few rounds left amplifies everything
  if (roundsLeft <= 5) score = clamp(score * 1.1, 0, 100);

  return Math.round(score);
}

const OBJECTIVE_LABELS: Record<CompetitiveObjective, string> = {
  title_race: "Disputa pelo título",
  continental_spot: "Vaga em competição continental",
  top_half_push: "Briga pelo G4/G6",
  mid_table: "Meio de tabela",
  relegation_battle: "Luta contra o rebaixamento",
  already_relegated: "Já rebaixado",
  no_objective: "Sem objetivo definido",
};
