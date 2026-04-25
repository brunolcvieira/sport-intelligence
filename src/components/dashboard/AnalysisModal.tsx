"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

type FixtureWithAll = Prisma.FixtureGetPayload<{
  include: { homeTeam: true; awayTeam: true; league: true; analysis: true };
}>;

export function AnalysisModal({ fixture, onClose }: { fixture: FixtureWithAll; onClose: () => void }) {
  const a = fixture.analysis;

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1929] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a1929]/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-2">
            {fixture.league.logo && (
              <Image src={fixture.league.logo} alt={fixture.league.name} width={20} height={20} unoptimized />
            )}
            <span className="text-sm font-semibold text-white/80">{fixture.league.name}</span>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-sm text-white/50 font-mono">{formatTime(fixture.date)}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              {fixture.homeTeam.logo && <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={56} height={56} unoptimized className="rounded-lg" />}
              <span className="text-white font-bold text-center leading-tight">{fixture.homeTeam.name}</span>
              <Badge variant="gray">Mandante</Badge>
            </div>

            <div className="text-center">
              {fixture.status !== "NS" ? (
                <span className="text-white font-mono font-bold text-3xl">
                  {fixture.homeGoals} — {fixture.awayGoals}
                </span>
              ) : (
                <span className="text-white/30 font-mono">VS</span>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              {fixture.awayTeam.logo && <Image src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} width={56} height={56} unoptimized className="rounded-lg" />}
              <span className="text-white font-bold text-center leading-tight">{fixture.awayTeam.name}</span>
              <Badge variant="gray">Visitante</Badge>
            </div>
          </div>

          {a ? (
            <>
              {/* Probability section */}
              <Section title="Probabilidades">
                <div className="space-y-2">
                  <ProbRow label={`Vitória ${fixture.homeTeam.name}`} pct={a.homeWinPct} color="bg-emerald-500" />
                  <ProbRow label="Empate" pct={a.drawPct} color="bg-yellow-500" />
                  <ProbRow label={`Vitória ${fixture.awayTeam.name}`} pct={a.awayWinPct} color="bg-red-500" />
                </div>
              </Section>

              {/* Score breakdown */}
              <Section title="Score de Força">
                <ScoreBreakdownTable
                  homeName={fixture.homeTeam.name}
                  awayName={fixture.awayTeam.name}
                  homeScore={a.homeScore}
                  awayScore={a.awayScore}
                />
              </Section>

              {/* Context */}
              <Section title="Contexto Competitivo">
                <div className="grid grid-cols-2 gap-3">
                  <ContextCard label={fixture.homeTeam.name} ctx={a.homeContext as string} />
                  <ContextCard label={fixture.awayTeam.name} ctx={a.awayContext as string} />
                </div>
              </Section>

              {/* Text summary */}
              {a.textSummary && (
                <Section title="Análise Completa">
                  <pre className="whitespace-pre-wrap text-sm text-white/70 font-mono leading-relaxed">
                    {a.textSummary}
                  </pre>
                </Section>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-white/40">
              Análise não disponível para esta partida.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/70 w-44 truncate">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-bold text-white w-10 text-right">{pct}%</span>
    </div>
  );
}

function ScoreBreakdownTable({ homeName, awayName, homeScore, awayScore }: {
  homeName: string; awayName: string; homeScore: number; awayScore: number;
}) {
  const maxScore = Math.max(homeScore, awayScore, 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/70 w-44 truncate">{homeName}</span>
        <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
          <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(homeScore / maxScore) * 100}%` }} />
        </div>
        <span className="text-sm font-mono font-bold text-cyan-400 w-10 text-right">{homeScore}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/70 w-44 truncate">{awayName}</span>
        <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(awayScore / maxScore) * 100}%` }} />
        </div>
        <span className="text-sm font-mono font-bold text-purple-400 w-10 text-right">{awayScore}</span>
      </div>
    </div>
  );
}

function ContextCard({ label, ctx }: { label: string; ctx: string }) {
  let parsed: { objectiveLabel?: string; rank?: number; points?: number; motivationScore?: number } = {};
  try { parsed = JSON.parse(ctx); } catch { /* ignore */ }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
      <p className="text-xs font-semibold text-white/60 truncate">{label}</p>
      {parsed.objectiveLabel && <p className="text-xs text-cyan-400">{parsed.objectiveLabel}</p>}
      {parsed.rank && <p className="text-xs text-white/50">{parsed.rank}º • {parsed.points} pts</p>}
      {parsed.motivationScore !== undefined && (
        <p className="text-xs text-white/50">Motivação: {parsed.motivationScore}/100</p>
      )}
    </div>
  );
}
