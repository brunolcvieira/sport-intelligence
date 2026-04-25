import { NextRequest, NextResponse } from "next/server";
import { getFixturesForDate } from "@/services/football/fixtures";
import { todayISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayISO();
  const league = searchParams.get("league");

  try {
    let fixtures = await getFixturesForDate(date);

    if (league) {
      fixtures = fixtures.filter((f) => f.leagueId === Number(league));
    }

    return NextResponse.json({ date, total: fixtures.length, fixtures });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
