import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyseFixture } from "@/services/analysis/orchestrator";

type RouteContext = {
  params: Promise<{
    fixtureId: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  const { fixtureId } = await context.params;
  const id = Number(fixtureId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid fixture ID" }, { status: 400 });
  }

  const existing = await prisma.matchAnalysis.findUnique({
    where: { fixtureId: id },
    include: {
      fixture: {
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      },
    },
  });

  if (existing) return NextResponse.json(existing);

  const fixture = await prisma.fixture.findUnique({ where: { id } });

  if (!fixture) {
    return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
  }

  try {
    const result = await analyseFixture(id, fixture.leagueId, fixture.season);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}