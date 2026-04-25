"use client";

import type { Prisma } from "@prisma/client";

type FixtureWithAll = Prisma.FixtureGetPayload<{
  include: { homeTeam: true; awayTeam: true; league: true; analysis: true };
}>;

export function StatsBar({ fixtures }: { fixtures: FixtureWithAll[] }) {
  const analysed = fixtures.filter((f) => f.analysis).length;
  const highConf = fixtures.filter((f) => f.analysis?.confidence === "high").length;
  const highDraw = fixtures.filter((f) => f.analysis?.drawTendency === "high").length;

  const stats = [
    { label: "Jogos Hoje", value: fixtures.length, color: "text-white" },
    { label: "Analisados", value: analysed, color: "text-cyan-400" },
    { label: "Alta Confiança", value: highConf, color: "text-emerald-400" },
    { label: "Tend. Empate ↑", value: highDraw, color: "text-yellow-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
          <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
