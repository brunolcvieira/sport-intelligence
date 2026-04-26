import { Suspense } from "react";
import { getFixturesForDate } from "@/services/football/fixtures";
import { MatchList } from "@/components/dashboard/MatchList";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { formatDate, todayISO } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RefreshButton } from "./RefreshButton";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    league?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const date = params.date ?? todayISO();
  const leagueFilter = params.league ? Number(params.league) : undefined;

  let fixtures = await getFixturesForDate(date);

  if (leagueFilter) {
    fixtures = fixtures.filter((f) => f.leagueId === leagueFilter);
  }

  const leagues = [
    ...new Map(fixtures.map((f) => [f.leagueId, f.league])).values(),
  ];

  return (
    <div className="min-h-screen bg-[#050d14]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050d14]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white tracking-tight">
              ⚽ Sport <span className="text-cyan-400">Intelligence</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <form method="GET">
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-500/50"
              />

              {leagueFilter && (
                <input type="hidden" name="league" value={leagueFilter} />
              )}
            </form>

            <RefreshButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">
            Jogos de {formatDate(date)}
          </h1>

          <p className="text-sm text-white/40 mt-0.5">
            Análise estatística automatizada — não constitui recomendação de aposta
          </p>
        </div>

        {leagues.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-5">
            <FilterPill
              href={`/dashboard?date=${date}`}
              active={!leagueFilter}
              label="Todas"
            />

            {leagues.map((l) => (
              <FilterPill
                key={l.id}
                href={`/dashboard?date=${date}&league=${l.id}`}
                active={leagueFilter === l.id}
                label={l.name}
              />
            ))}
          </div>
        )}

        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <LoadingSpinner size={40} />
            </div>
          }
        >
          <StatsBar fixtures={fixtures} />
          <MatchList fixtures={fixtures} />
        </Suspense>
      </main>
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={href}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
          : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </a>
  );
}