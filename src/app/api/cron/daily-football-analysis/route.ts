import { NextRequest, NextResponse } from "next/server";
import { runDailyAnalysis } from "@/services/analysis/orchestrator";

export const maxDuration = 300; // 5 min — Vercel Pro limit

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization header)
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyAnalysis();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[CRON] daily-football-analysis failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
