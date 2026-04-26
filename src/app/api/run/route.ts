import { NextRequest, NextResponse } from "next/server";
import { runDailyAnalysis } from "@/services/analysis/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await runDailyAnalysis(body.date);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Erro ao rodar análise:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}