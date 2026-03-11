import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlanView } from "@/components/plan-view";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import type { PlanWithDetails, PlanSummary } from "@/lib/types";

// Always render at request time (needs DB data)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [plan, users] = await Promise.all([
    prisma.strategicPlan.findFirst({
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
    }),
    prisma.user.findMany({
      select: { id: true, name: true, initials: true },
      orderBy: { name: "asc" },
    }),
  ]);

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

  return <PlanView plan={plan as PlanWithDetails} users={users} />;
}
