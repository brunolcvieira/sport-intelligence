/**
 * POST /api/run
 * Trigger analysis on-demand from the dashboard (dev/staging only).
 * Body: { date?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { runDailyAnalysis } from "@/services/analysis/orchestrator";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use the cron endpoint in production" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await runDailyAnalysis(body.date);
  return NextResponse.json(result);
}
