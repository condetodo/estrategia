import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/dashboard-view";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  getPlanStats,
  getAreaStats,
  getDirectionStats,
  getMonthlyData,
} from "@/lib/stats";
import type { PlanWithDetails, PlanSummary } from "@/lib/types";

// Always render at request time (needs DB data)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
    const isAdmin = (session.user as any).role === "ADMIN";
    const draftPlans = isAdmin
      ? ((await prisma.strategicPlan.findMany({
          where: { status: "DRAFT" },
          select: {
            id: true, year: true, company: true, status: true,
            _count: { select: { areas: true, directions: true } },
          },
          orderBy: { updatedAt: "desc" },
        })) as PlanSummary[])
      : [];

    return (
      <div className="flex h-screen flex-col">
        <Header />
        <EmptyState isAdmin={isAdmin} draftPlans={draftPlans} />
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
