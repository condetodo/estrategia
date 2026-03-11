"use client";

import { useOptimistic, useTransition } from "react";
import { Header } from "@/components/header";
import { updateTaskStatus } from "@/actions/tasks";
import { MONTHS, STATUS_CONFIG } from "@/lib/types";
import type { TaskData } from "@/lib/types";
import type { TaskStatus } from "@/generated/prisma/enums";

const statuses: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"];

type MyItem = {
  id: string;
  subtheme: string;
  agenda: string | null;
  areaName: string;
  areaColor: string;
  directionNumber: number | null;
  tasks: TaskData[];
};

type MyTasksViewProps = {
  company: string;
  year: number;
  userName: string;
  items: MyItem[];
};

export function MyTasksView({ company, year, userName, items }: MyTasksViewProps) {
  const totalTasks = items.reduce((sum, i) => sum + i.tasks.length, 0);
  const completedTasks = items.reduce(
    (sum, i) => sum + i.tasks.filter((t) => t.status === "COMPLETED").length,
    0
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header company={company} year={year} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Mis Tareas
            </h2>
            <p className="text-sm text-muted">
              {userName} — {completedTasks}/{totalTasks} tareas completadas
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <p className="text-muted">
                No tenés iniciativas asignadas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ItemCard({ item }: { item: MyItem }) {
  const completed = item.tasks.filter((t) => t.status === "COMPLETED").length;
  const total = item.tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      {/* Item header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <div
          className="h-3 w-3 rounded-sm shrink-0"
          style={{ backgroundColor: item.areaColor }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">
              {item.agenda || item.subtheme}
            </h3>
            {item.directionNumber && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shrink-0">
                {item.directionNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{item.areaName}</span>
            <span>•</span>
            <span>{item.subtheme}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1.5 w-16 rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-primary-light transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted">{pct}%</span>
        </div>
      </div>

      {/* Tasks */}
      {total === 0 ? (
        <p className="px-5 py-4 text-center text-sm text-muted">
          Sin tareas definidas
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {item.tasks.map((task) => (
            <MyTaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyTaskRow({ task }: { task: TaskData }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const [isPending, startTransition] = useTransition();
  const config = STATUS_CONFIG[optimisticStatus];

  function handleStatusChange(newStatus: TaskStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateTaskStatus(task.id, newStatus);
    });
  }

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{task.name}</p>
        <p className="text-xs text-muted">
          {MONTHS[task.startMonth - 1]}
          {task.endMonth !== task.startMonth && ` – ${MONTHS[task.endMonth - 1]}`}
        </p>
        {task.notes && (
          <p className="mt-0.5 text-xs text-muted/70 leading-relaxed">{task.notes}</p>
        )}
      </div>

      {/* Status badge */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.label}
      </span>

      {/* Quick status buttons */}
      <div className="flex gap-1 shrink-0">
        {statuses.map((s) => {
          const c = STATUS_CONFIG[s];
          const isActive = s === optimisticStatus;
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={isPending}
              className={`h-6 w-6 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? "ring-2 ring-offset-1"
                  : "opacity-30 hover:opacity-70"
              }`}
              style={{
                backgroundColor: c.bg,
                color: c.color,
                ...(isActive ? { ringColor: c.color } : {}),
              }}
              title={c.label}
            >
              {s === "NOT_STARTED"
                ? "—"
                : s === "IN_PROGRESS"
                  ? "▶"
                  : s === "COMPLETED"
                    ? "✓"
                    : "✕"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
