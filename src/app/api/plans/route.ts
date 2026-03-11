import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans - List all plans
export async function GET() {
  const plans = await prisma.strategicPlan.findMany({
    include: {
      _count: { select: { areas: true, directions: true } },
    },
    orderBy: { year: "desc" },
  });
  return NextResponse.json(plans);
}
