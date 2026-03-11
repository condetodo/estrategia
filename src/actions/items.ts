"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createItem(data: {
  subtheme: string;
  agenda?: string;
  areaId: string;
  directionId?: string;
  responsibleId?: string;
}) {
  const maxOrder = await prisma.item.findFirst({
    where: { areaId: data.areaId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.item.create({
    data: { ...data, order: (maxOrder?.order ?? 0) + 1 },
  });
  revalidatePath("/");
}

export async function updateItem(
  itemId: string,
  data: {
    subtheme?: string;
    agenda?: string;
    directionId?: string;
    responsibleId?: string;
  }
) {
  await prisma.item.update({ where: { id: itemId }, data });
  revalidatePath("/");
}

export async function deleteItem(itemId: string) {
  await prisma.item.delete({ where: { id: itemId } });
  revalidatePath("/");
}

export async function assignResponsible(itemId: string, userId: string | null) {
  await prisma.item.update({
    where: { id: itemId },
    data: { responsibleId: userId },
  });
  revalidatePath("/");
}
