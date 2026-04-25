"use client";

import { MatchCard } from "./MatchCard";
import type { Prisma } from "@prisma/client";

type FixtureWithAll = Prisma.FixtureGetPayload<{
  include: { homeTeam: true; awayTeam: true; league: true; analysis: true };
}>;

interface MatchListProps {
  fixtures: FixtureWithAll[];
  groupByLeague?: boolean;
}

export function MatchList({ fixtures, groupByLeague = true }: MatchListProps) {
  if (!fixtures.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <span className="text-4xl mb-3">⚽</span>
        <p className="text-sm">Nenhum jogo encontrado para esta data.</p>
        <p className="text-xs mt-1">Execute o cron para buscar os jogos do dia.</p>
      </div>
    );
  }

  if (!groupByLeague) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
      </div>
    );
  }

  // Group by league
  const grouped = fixtures.reduce<Record<string, FixtureWithAll[]>>((acc, f) => {
    const key = f.league.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([leagueName, items]) => (
        <div key={leagueName}>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            {items[0]?.league.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={items[0].league.logo} alt="" width={16} height={16} className="rounded-sm" />
            )}
            {leagueName}
            <span className="text-white/20 text-xs font-normal normal-case">({items.length} jogos)</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((f) => <MatchCard key={f.id} fixture={f} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
