import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { ToolsPanel } from "@/components/tools-panel";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = await prisma.strategicPlan.findFirst({
    where: { status: "ACTIVE" },
    select: { company: true, year: true },
  });

  if (!plan) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted">No hay plan activo.</p>
      </div>
    );
  }

  const isAdmin = (session.user as any).role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <Header company={plan.company} year={plan.year} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-lg font-bold text-foreground">Herramientas</h2>
          <ToolsPanel isAdmin={isAdmin} year={plan.year} />
        </div>
      </main>
    </div>
  );
}
