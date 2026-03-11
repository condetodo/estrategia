import { prisma } from "@/lib/prisma";
import { PlanView } from "@/components/plan-view";
import type { PlanWithDetails } from "@/lib/types";

export default async function HomePage() {
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

  return <PlanView plan={plan as PlanWithDetails} />;
}
