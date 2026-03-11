"use client";

import { useState, useTransition } from "react";
import { MONTHS, STATUS_CONFIG } from "@/lib/types";
import { createItem } from "@/actions/items";
import type { AreaWithItems, ItemWithTasks, TaskData, DirectionData, UserOption } from "@/lib/types";

export function GanttView({
  areas,
  directions,
  users,
  onItemClick,
  selectedItemId,
}: {
  areas: AreaWithItems[];
  directions: DirectionData[];
  users: UserOption[];
  onItemClick: (item: ItemWithTasks) => void;
  selectedItemId: string | null;
}) {
  return (
    <div className="gantt-scroll overflow-x-auto px-6 pb-6">
      <div className="min-w-[1100px]">
        {/* Month headers */}
        <div className="sticky top-0 z-10 mb-1 flex bg-background">
          <div className="w-72 shrink-0" />
          <div className="flex flex-1">
            {MONTHS.map((month, i) => {
              const now = new Date();
              const currentMonth = now.getMonth(); // 0-indexed
              const isCurrent = i === currentMonth;
              return (
                <div
                  key={month}
                  className={`flex-1 border-b-2 py-2 text-center text-xs font-semibold ${
                    isCurrent
                      ? "border-primary-light text-primary-light"
                      : "border-border text-muted"
                  }`}
                >
                  {month}
                </div>
              );
            })}
          </div>
        </div>

        {/* Areas */}
        {areas.map((area) => (
          <AreaSection
            key={area.id}
            area={area}
            directions={directions}
            users={users}
            onItemClick={onItemClick}
            selectedItemId={selectedItemId}
          />
        ))}
      </div>
    </div>
  );
}

function AreaSection({
  area,
  directions,
  users,
  onItemClick,
  selectedItemId,
}: {
  area: AreaWithItems;
  directions: DirectionData[];
  users: UserOption[];
  onItemClick: (item: ItemWithTasks) => void;
  selectedItemId: string | null;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mb-4">
      {/* Area header */}
      <div className="flex items-center gap-2 py-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: area.color }}
        />
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/70">
          {area.name}
        </h3>
        <span className="text-xs text-muted">
          {area.items.length} iniciativas
        </span>
      </div>

      {/* Items */}
      {area.items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          areaColor={area.color}
          onClick={() => onItemClick(item)}
          isSelected={item.id === selectedItemId}
        />
      ))}

      {/* Add item */}
      {showForm ? (
        <AddItemForm
          areaId={area.id}
          directions={directions}
          users={users}
          onClose={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-1 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar iniciativa
        </button>
      )}
    </div>
  );
}

function AddItemForm({
  areaId,
  directions,
  users,
  onClose,
}: {
  areaId: string;
  directions: DirectionData[];
  users: UserOption[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [subtheme, setSubtheme] = useState("");
  const [agenda, setAgenda] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");

  function handleSubmit() {
    if (!subtheme.trim()) return;
    startTransition(async () => {
      await createItem({
        subtheme: subtheme.trim(),
        agenda: agenda.trim() || undefined,
        areaId,
        directionId: directionId || undefined,
        responsibleId: responsibleId || undefined,
      });
      onClose();
    });
  }

  return (
    <div className="mt-1 rounded-lg border border-primary/30 bg-blue-50/30 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={subtheme}
          onChange={(e) => setSubtheme(e.target.value)}
          placeholder="Subtema *"
          className="rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          autoFocus
        />
        <input
          type="text"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Agenda (opcional)"
          className="rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <select
          value={directionId}
          onChange={(e) => setDirectionId(e.target.value)}
          className="rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Dirección (opcional)</option>
          {directions.map((d) => (
            <option key={d.id} value={d.id}>
              Dir. {d.number}: {d.description.slice(0, 40)}
            </option>
          ))}
        </select>
        <select
          value={responsibleId}
          onChange={(e) => setResponsibleId(e.target.value)}
          className="rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Responsable (opcional)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.initials ? `(${u.initials})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || !subtheme.trim()}
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

function ItemRow({
  item,
  areaColor,
  onClick,
  isSelected,
}: {
  item: ItemWithTasks;
  areaColor: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  const completedTasks = item.tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasks = item.tasks.length;

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center rounded-lg border transition-all hover:shadow-sm ${
        isSelected
          ? "border-primary-light bg-blue-50/50 shadow-sm"
          : "border-transparent hover:border-border hover:bg-surface"
      }`}
    >
      {/* Item info */}
      <div className="w-72 shrink-0 px-3 py-2">
        <div className="flex items-start gap-2">
          <div
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: areaColor }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {item.agenda || item.subtheme}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{item.subtheme}</span>
              {totalTasks > 0 && (
                <span>
                  {completedTasks}/{totalTasks}
                </span>
              )}
              {item.responsible && (
                <span className="rounded bg-surface-hover px-1.5 py-0.5 font-medium">
                  {item.responsible.initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="flex flex-1">
        {MONTHS.map((_, monthIndex) => {
          const monthTasks = item.tasks.filter(
            (t) => monthIndex + 1 >= t.startMonth && monthIndex + 1 <= t.endMonth
          );
          return (
            <div
              key={monthIndex}
              className="flex flex-1 items-center justify-center border-l border-border/30 py-2"
            >
              {monthTasks.map((task) => (
                <TaskDot key={task.id} task={task} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskDot({ task }: { task: TaskData }) {
  const config = STATUS_CONFIG[task.status];
  return (
    <div
      className="mx-0.5 h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-125"
      style={{
        backgroundColor: config.bg,
        borderColor: config.color,
      }}
      title={`${task.name} — ${config.label}`}
    />
  );
}
