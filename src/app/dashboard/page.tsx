import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/dashboard-view";
import {
  getPlanStats,
  getAreaStats,
  getDirectionStats,
  getMonthlyData,
} from "@/lib/stats";
import type { PlanWithDetails } from "@/lib/types";

// Always render at request time (needs DB data)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const plan = await prisma.strategicPlan.findFirst({
    where: { status: "ACTIVE" },
    include: {
      directions: { orderBy: { number: "asc" } },
      areas: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              tasks: { orderBy: { startMonth: "asc" } },
              responsible: {
                select: { id: true, name: true, initials: true },
              },
              direction: {
                select: { id: true, number: true, description: true },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted">No hay plan activo.</p>
      </div>
    );
  }

  const typedPlan = plan as PlanWithDetails;

  return (
    <DashboardView
      company={typedPlan.company}
      year={typedPlan.year}
      planStats={getPlanStats(typedPlan)}
      areaStats={getAreaStats(typedPlan)}
      directionStats={getDirectionStats(typedPlan)}
      monthlyData={getMonthlyData(typedPlan)}
    />
  );
}
