"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { useState } from "react";
import { AnalysisModal } from "./AnalysisModal";

type FixtureWithAll = Prisma.FixtureGetPayload<{
  include: { homeTeam: true; awayTeam: true; league: true; analysis: true };
}>;

export function MatchCard({ fixture }: { fixture: FixtureWithAll }) {
  const [open, setOpen] = useState(false);
  const a = fixture.analysis;

  const confidenceVariant =
    a?.confidence === "high" ? "green" : a?.confidence === "medium" ? "yellow" : "gray";

  const drawVariant =
    a?.drawTendency === "high" ? "red" : a?.drawTendency === "medium" ? "yellow" : "gray";

  const favoriteLabel =
    a?.favorite === "home"
      ? fixture.homeTeam.name
      : a?.favorite === "away"
      ? fixture.awayTeam.name
      : "Equilíbrio";

  return (
    <>
      <div onClick={() => setOpen(true)}>
        <Card className="group p-4 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {fixture.league.logo && (
                <Image
                  src={fixture.league.logo}
                  alt={fixture.league.name}
                  width={16}
                  height={16}
                  className="rounded-sm"
                  unoptimized
                />
              )}
              <span className="text-xs text-white/50 font-medium truncate max-w-[180px]">
                {fixture.league.name}
              </span>
            </div>

            <span className="text-xs text-white/40 font-mono">
              {formatTime(fixture.date)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <TeamBlock
              name={fixture.homeTeam.name}
              logo={fixture.homeTeam.logo}
              align="left"
            />

            <div className="flex flex-col items-center gap-1">
              <span className="text-white/30 text-sm font-mono">VS</span>
              {fixture.status !== "NS" && (
                <span className="text-white font-mono font-bold text-lg">
                  {fixture.homeGoals ?? 0} — {fixture.awayGoals ?? 0}
                </span>
              )}
            </div>

            <TeamBlock
              name={fixture.awayTeam.name}
              logo={fixture.awayTeam.logo}
              align="right"
            />
          </div>

          {a ? (
            <>
              <ProbabilityBar
                home={a.homeWinPct}
                draw={a.drawPct}
                away={a.awayWinPct}
              />

              <div className="mt-3 flex items-center flex-wrap gap-1.5">
                <Badge variant="teal">🎯 {favoriteLabel}</Badge>

                <Badge variant={confidenceVariant}>
                  Confiança:{" "}
                  {a.confidence === "high"
                    ? "Alta"
                    : a.confidence === "medium"
                    ? "Média"
                    : "Baixa"}
                </Badge>

                <Badge variant={drawVariant}>
                  Empate:{" "}
                  {a.drawTendency === "high"
                    ? "Alta"
                    : a.drawTendency === "medium"
                    ? "Média"
                    : "Baixa"}
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-center text-white/30 text-xs py-2">
              Análise pendente
            </div>
          )}

          <button
            type="button"
            className="mt-3 w-full text-center text-xs text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/20 rounded-lg py-1.5 hover:bg-cyan-500/10"
          >
            Ver análise completa →
          </button>
        </Card>
      </div>

      {open && <AnalysisModal fixture={fixture} onClose={() => setOpen(false)} />}
    </>
  );
}

function TeamBlock({
  name,
  logo,
  align,
}: {
  name: string;
  logo: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col items-${
        align === "left" ? "start" : "end"
      } gap-1.5 flex-1`}
    >
      {logo && (
        <Image
          src={logo}
          alt={name}
          width={32}
          height={32}
          unoptimized
          className="rounded-sm"
        />
      )}
      <span className="text-sm font-semibold text-white leading-tight">
        {name}
      </span>
    </div>
  );
}

function ProbabilityBar({
  home,
  draw,
  away,
}: {
  home: number;
  draw: number;
  away: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex rounded-full overflow-hidden h-2">
        <div style={{ width: `${home}%` }} className="bg-emerald-500 transition-all" />
        <div style={{ width: `${draw}%` }} className="bg-yellow-500 transition-all" />
        <div style={{ width: `${away}%` }} className="bg-red-500 transition-all" />
      </div>

      <div className="flex justify-between text-[10px] text-white/50 font-mono">
        <span className="text-emerald-400">{home}%</span>
        <span className="text-yellow-400">{draw}%</span>
        <span className="text-red-400">{away}%</span>
      </div>
    </div>
  );
}