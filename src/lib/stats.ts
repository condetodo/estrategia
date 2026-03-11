import type { PlanWithDetails, AreaWithItems, TaskData } from "@/lib/types";
import type { TaskStatus } from "@/generated/prisma/enums";

export type PlanStats = {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  completionPct: number;
};

export type AreaStats = {
  areaId: string;
  areaName: string;
  areaColor: string;
  total: number;
  completed: number;
  pct: number;
};

export type DirectionStats = {
  directionId: string;
  number: number;
  description: string;
  items: { subtheme: string; agenda: string | null; pct: number }[];
  totalTasks: number;
  completedTasks: number;
  pct: number;
};

export type MonthlyData = {
  month: string;
  planned: number;
  completed: number;
};

function allTasks(plan: PlanWithDetails): TaskData[] {
  return plan.areas.flatMap((a) => a.items.flatMap((i) => i.tasks));
}

function countByStatus(tasks: TaskData[], status: TaskStatus): number {
  return tasks.filter((t) => t.status === status).length;
}

export function getPlanStats(plan: PlanWithDetails): PlanStats {
  const tasks = allTasks(plan);
  const total = tasks.length;
  const completed = countByStatus(tasks, "COMPLETED");
  return {
    total,
    completed,
    inProgress: countByStatus(tasks, "IN_PROGRESS"),
    blocked: countByStatus(tasks, "BLOCKED"),
    notStarted: countByStatus(tasks, "NOT_STARTED"),
    completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getAreaStats(plan: PlanWithDetails): AreaStats[] {
  return plan.areas.map((area) => {
    const tasks = area.items.flatMap((i) => i.tasks);
    const total = tasks.length;
    const completed = countByStatus(tasks, "COMPLETED");
    return {
      areaId: area.id,
      areaName: area.name,
      areaColor: area.color,
      total,
      completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export function getDirectionStats(plan: PlanWithDetails): DirectionStats[] {
  return plan.directions.map((dir) => {
    const dirItems = plan.areas
      .flatMap((a) => a.items)
      .filter((item) => item.direction?.id === dir.id);

    const items = dirItems.map((item) => {
      const total = item.tasks.length;
      const completed = countByStatus(item.tasks, "COMPLETED");
      return {
        subtheme: item.subtheme,
        agenda: item.agenda,
        pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const totalTasks = dirItems.reduce((sum, i) => sum + i.tasks.length, 0);
    const completedTasks = dirItems.reduce(
      (sum, i) => sum + countByStatus(i.tasks, "COMPLETED"),
      0
    );

    return {
      directionId: dir.id,
      number: dir.number,
      description: dir.description,
      items,
      totalTasks,
      completedTasks,
      pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });
}

export function getMonthlyData(plan: PlanWithDetails): MonthlyData[] {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const tasks = allTasks(plan);

  let cumulativePlanned = 0;
  let cumulativeCompleted = 0;

  return months.map((month, i) => {
    const monthNum = i + 1;
    // Tasks planned to end by this month
    const plannedThisMonth = tasks.filter((t) => t.endMonth === monthNum).length;
    cumulativePlanned += plannedThisMonth;

    // Completed tasks that were due by this month
    const completedThisMonth = tasks.filter(
      (t) => t.endMonth === monthNum && t.status === "COMPLETED"
    ).length;
    cumulativeCompleted += completedThisMonth;

    return {
      month,
      planned: cumulativePlanned,
      completed: cumulativeCompleted,
    };
  });
}
