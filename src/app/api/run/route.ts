import { NextRequest, NextResponse } from "next/server";
import { runDailyAnalysis } from "@/services/analysis/orchestrator";

export async function POST(req: NextRequest) {
  try {
    // 🔐 Permitir execução via CRON (produção)
    const authHeader = req.headers.get("authorization");
    const cronHeader = req.headers.get("x-cron-secret");

    const token = authHeader?.replace("Bearer ", "");

    const isAuthorized =
      token === process.env.CRON_SECRET ||
      cronHeader === process.env.CRON_SECRET ||
      process.env.NODE_ENV !== "production"; // libera no dev

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const result = await runDailyAnalysis(body.date);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}