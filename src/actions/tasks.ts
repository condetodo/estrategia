"use server";

import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
  revalidatePath("/");
}

export async function updateTaskNotes(taskId: string, notes: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { notes },
  });
  revalidatePath("/");
}

export async function createTask(data: {
  name: string;
  startMonth: number;
  endMonth: number;
  itemId: string;
  notes?: string;
}) {
  await prisma.task.create({ data });
  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/");
}
