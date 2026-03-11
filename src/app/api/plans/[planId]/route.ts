import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans/[planId] - Full plan with all nested data (for GanttView)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    include: {
      directions: { orderBy: { number: "asc" } },
      areas: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              tasks: { orderBy: { startMonth: "asc" } },
              responsible: { select: { id: true, name: true, initials: true } },
              direction: { select: { id: true, number: true, description: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}
