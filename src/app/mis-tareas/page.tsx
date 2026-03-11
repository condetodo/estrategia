import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyTasksView } from "@/components/my-tasks-view";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import type { TaskData, PlanSummary } from "@/lib/types";

// Always render at request time (needs DB + session)
export const dynamic = "force-dynamic";

export default async function MisTareasPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const plan = await prisma.strategicPlan.findFirst({
    where: { status: "ACTIVE" },
    select: { company: true, year: true },
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

  // Fetch items assigned to the current user with their area info
  const items = await prisma.item.findMany({
    where: { responsibleId: session.user.id },
    orderBy: { order: "asc" },
    include: {
      area: { select: { name: true, color: true } },
      direction: { select: { number: true } },
      tasks: { orderBy: { startMonth: "asc" } },
    },
  });

  const mappedItems = items.map((item) => ({
    id: item.id,
    subtheme: item.subtheme,
    agenda: item.agenda,
    areaName: item.area.name,
    areaColor: item.area.color,
    directionNumber: item.direction?.number ?? null,
    tasks: item.tasks.map(
      (t): TaskData => ({
        id: t.id,
        name: t.name,
        startMonth: t.startMonth,
        endMonth: t.endMonth,
        status: t.status,
        notes: t.notes,
      })
    ),
  }));

  return (
    <MyTasksView
      company={plan.company}
      year={plan.year}
      userName={session.user.name ?? "Usuario"}
      items={mappedItems}
    />
  );
}
