"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/cron/daily-football-analysis", {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      const data = await res.json();
      setStatus(res.ok ? `✓ ${data.analysed} analisados` : "Erro");
      router.refresh();
    } catch {
      setStatus("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
    >
      {loading ? <LoadingSpinner size={12} /> : "⟳"}
      {status ?? "Atualizar análises"}
    </button>
  );
}
