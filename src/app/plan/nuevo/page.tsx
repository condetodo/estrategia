import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { PlanWizard } from "@/components/plan-wizard";
import type { WizardPlanData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins can create plans
  if ((session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;
  let initialData: WizardPlanData | null = null;

  // Resume a draft plan if planId is provided
  if (params.planId) {
    const plan = await prisma.strategicPlan.findUnique({
      where: { id: params.planId },
      include: {
        directions: { orderBy: { number: "asc" } },
        areas: { orderBy: { order: "asc" } },
      },
    });

    if (plan && plan.status === "DRAFT") {
      initialData = {
        id: plan.id,
        year: plan.year,
        company: plan.company,
        status: plan.status,
        directions: plan.directions.map((d) => ({
          id: d.id,
          number: d.number,
          description: d.description,
        })),
        areas: plan.areas.map((a) => ({
          id: a.id,
          name: a.name,
          color: a.color,
          icon: a.icon,
          order: a.order,
        })),
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PlanWizard initialData={initialData} />
      </main>
    </div>
  );
}
