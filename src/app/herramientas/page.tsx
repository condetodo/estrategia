import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { ToolsPanel } from "@/components/tools-panel";
import { EmptyState } from "@/components/empty-state";
import { PlanManager } from "@/components/plan-manager";
import type { PlanSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = (session.user as any).role === "ADMIN";

  const plan = await prisma.strategicPlan.findFirst({
    where: { status: "ACTIVE" },
    select: { company: true, year: true },
  });

  // Fetch all plans for admin plan manager
  const allPlans = isAdmin
    ? ((await prisma.strategicPlan.findMany({
        select: {
          id: true, year: true, company: true, status: true,
          _count: { select: { areas: true, directions: true } },
        },
        orderBy: [{ status: "asc" }, { year: "desc" }],
      })) as PlanSummary[])
    : [];

  if (!plan) {
    const draftPlans = allPlans.filter((p) => p.status === "DRAFT");
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <EmptyState isAdmin={isAdmin} draftPlans={draftPlans} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header company={plan.company} year={plan.year} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h2 className="mb-6 text-lg font-bold text-foreground">Herramientas</h2>
            <ToolsPanel isAdmin={isAdmin} year={plan.year} />
          </div>
          {isAdmin && <PlanManager plans={allPlans} />}
        </div>
      </main>
    </div>
  );
}
