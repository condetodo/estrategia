"use client";

import { useOptimistic, useTransition } from "react";
import { updateTaskStatus } from "@/actions/tasks";
import { assignResponsible } from "@/actions/items";
import { MONTHS, STATUS_CONFIG } from "@/lib/types";
import type { ItemWithTasks, TaskData, UserOption } from "@/lib/types";
import type { TaskStatus } from "@/generated/prisma/enums";

const statuses: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"];

export function DrillDownPanel({
  item,
  users,
  onClose,
}: {
  item: ItemWithTasks;
  users: UserOption[];
  onClose: () => void;
}) {
  const [isPendingAssign, startAssignTransition] = useTransition();

  function handleAssign(userId: string) {
    startAssignTransition(async () => {
      await assignResponsible(item.id, userId || null);
    });
  }

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-surface lg:w-96">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="min-w-0 pr-2">
          <h2 className="text-sm font-bold text-foreground">
            {item.agenda || item.subtheme}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{item.subtheme}</p>

          {/* Responsible selector */}
          <div className="mt-2">
            <label className="text-xs text-muted">Responsable:</label>
            <select
              value={item.responsible?.id ?? ""}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={isPendingAssign}
              className="ml-1 rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground focus:border-primary-light focus:outline-none disabled:opacity-50"
            >
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.initials})
                </option>
              ))}
            </select>
          </div>

          {item.direction && (
            <p className="mt-1 text-xs text-muted">
              Dir. {item.direction.number}:{" "}
              <span className="text-foreground/70">
                {item.direction.description}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <ProgressSummary tasks={item.tasks} />

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Tareas ({item.tasks.length})
        </h3>
        {item.tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Sin tareas definidas
          </p>
        ) : (
          <div className="space-y-2">
            {item.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressSummary({ tasks }: { tasks: TaskData[] }) {
  const total = tasks.length;
  if (total === 0) return null;

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Avance</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-primary-light transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: TaskData }) {
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
      className={`rounded-lg border border-border p-3 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{task.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {MONTHS[task.startMonth - 1]}
            {task.endMonth !== task.startMonth &&
              ` – ${MONTHS[task.endMonth - 1]}`}
          </p>
          {task.notes && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {task.notes}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Status buttons */}
      <div className="mt-2.5 flex gap-1">
        {statuses.map((s) => {
          const c = STATUS_CONFIG[s];
          const isActive = s === optimisticStatus;
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={isPending}
              className={`flex-1 rounded py-1 text-xs font-medium transition-all ${
                isActive
                  ? "ring-1 ring-offset-1"
                  : "opacity-50 hover:opacity-80"
              }`}
              style={{
                backgroundColor: c.bg,
                color: c.color,
                ...(isActive ? { ringColor: c.color } : {}),
              }}
              title={c.label}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
