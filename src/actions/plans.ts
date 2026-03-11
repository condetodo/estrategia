"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// -- Helpers --

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if ((session.user as any).role !== "ADMIN") throw new Error("Sin permisos");
  return session;
}

// -- Plan lifecycle --

export async function createPlan(data: { year: number; company: string }) {
  await requireAdmin();

  const plan = await prisma.strategicPlan.create({
    data: {
      year: data.year,
      company: data.company.trim(),
      status: "DRAFT",
    },
  });

  revalidatePath("/");
  return plan.id;
}

export async function activatePlan(planId: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    // Archive any currently active plan
    await tx.strategicPlan.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    // Activate target plan
    await tx.strategicPlan.update({
      where: { id: planId },
      data: { status: "ACTIVE" },
    });
  });

  revalidatePath("/");
  redirect("/");
}

export async function archivePlan(planId: string) {
  await requireAdmin();

  await prisma.strategicPlan.update({
    where: { id: planId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/");
}

export async function deleteDraftPlan(planId: string) {
  await requireAdmin();

  // Safety: only delete DRAFT plans
  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    select: { status: true },
  });
  if (!plan || plan.status !== "DRAFT") {
    throw new Error("Solo se pueden eliminar planes en borrador");
  }

  await prisma.strategicPlan.delete({ where: { id: planId } });
  revalidatePath("/");
}

// -- Directions (batch) --

export async function setDirections(
  planId: string,
  directions: { number: number; description: string }[]
) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    // Remove existing directions for this plan
    await tx.direction.deleteMany({ where: { planId } });
    // Create new ones
    if (directions.length > 0) {
      await tx.direction.createMany({
        data: directions.map((d) => ({
          planId,
          number: d.number,
          description: d.description.trim(),
        })),
      });
    }
  });

  revalidatePath("/");
}

// -- Areas (batch) --

export async function setAreas(
  planId: string,
  areas: { name: string; color: string; icon?: string; order: number }[]
) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    // Remove existing areas (cascades items/tasks)
    await tx.area.deleteMany({ where: { planId } });
    // Create new ones
    if (areas.length > 0) {
      await tx.area.createMany({
        data: areas.map((a) => ({
          planId,
          name: a.name.trim(),
          color: a.color,
          icon: a.icon ?? null,
          order: a.order,
        })),
      });
    }
  });

  revalidatePath("/");
}
