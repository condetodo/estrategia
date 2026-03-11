"use client";

import { useState, useOptimistic, useTransition } from "react";
import { updateTaskStatus, createTask, deleteTask } from "@/actions/tasks";
import { assignResponsible, deleteItem } from "@/actions/items";
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
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  function handleAssign(userId: string) {
    startAssignTransition(async () => {
      await assignResponsible(item.id, userId || null);
    });
  }

  function handleDeleteItem() {
    startDeleteTransition(async () => {
      await deleteItem(item.id);
      onClose();
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
        <div className="flex shrink-0 items-center gap-1">
          {/* Delete item */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteItem}
                disabled={isPendingDelete}
                className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isPendingDelete ? "..." : "Eliminar"}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="rounded px-2 py-1 text-xs text-muted hover:text-foreground"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
              title="Eliminar iniciativa"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
          {/* Close */}
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressSummary tasks={item.tasks} />

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Tareas ({item.tasks.length})
        </h3>
        {item.tasks.length === 0 && !showAddTask ? (
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

        {/* Add task */}
        {showAddTask ? (
          <AddTaskForm itemId={item.id} onClose={() => setShowAddTask(false)} />
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-primary"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar tarea
          </button>
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
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const config = STATUS_CONFIG[optimisticStatus];

  function handleStatusChange(newStatus: TaskStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateTaskStatus(task.id, newStatus);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <div
      className={`group rounded-lg border border-border p-3 transition-opacity ${
        isPending || isPendingDelete ? "opacity-60" : ""
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
        <div className="flex items-center gap-1.5">
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {config.label}
          </span>
          <button
            onClick={handleDelete}
            disabled={isPendingDelete}
            className="shrink-0 rounded p-0.5 text-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            title="Eliminar tarea"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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

function AddTaskForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);

  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createTask({
        name: name.trim(),
        startMonth,
        endMonth: Math.max(endMonth, startMonth),
        itemId,
      });
      onClose();
    });
  }

  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-blue-50/30 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la tarea *"
        className="mb-2 w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        autoFocus
      />
      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label className="mb-0.5 block text-xs text-muted">Mes inicio</label>
          <select
            value={startMonth}
            onChange={(e) => {
              const v = Number(e.target.value);
              setStartMonth(v);
              if (endMonth < v) setEndMonth(v);
            }}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-0.5 block text-xs text-muted">Mes fin</label>
          <select
            value={endMonth}
            onChange={(e) => setEndMonth(Number(e.target.value))}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1} disabled={i + 1 < startMonth}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
