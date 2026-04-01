"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addArea(
  planId: string,
  data: { name: string; color: string }
) {
  const maxOrder = await prisma.area.findFirst({
    where: { planId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.area.create({
    data: {
      planId,
      name: data.name.trim(),
      color: data.color,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });
  revalidatePath("/");
}

export async function updateArea(
  areaId: string,
  data: { name?: string; color?: string }
) {
  await prisma.area.update({
    where: { id: areaId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
  revalidatePath("/");
}

export async function deleteArea(areaId: string) {
  // Prisma cascades: Area -> Items -> Tasks all deleted
  await prisma.area.delete({ where: { id: areaId } });
  revalidatePath("/");
}
