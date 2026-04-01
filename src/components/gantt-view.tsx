"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { MONTHS, STATUS_CONFIG, AREA_COLORS } from "@/lib/types";
import { createItem } from "@/actions/items";
import { addArea, updateArea, deleteArea } from "@/actions/areas";
import type { AreaWithItems, ItemWithTasks, TaskData, DirectionData, UserOption } from "@/lib/types";

export function GanttView({
  areas,
  directions,
  users,
  planId,
  isAdmin,
  onItemClick,
  selectedItemId,
}: {
  areas: AreaWithItems[];
  directions: DirectionData[];
  users: UserOption[];
  planId: string;
  isAdmin: boolean;
  onItemClick: (item: ItemWithTasks) => void;
  selectedItemId: string | null;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="gantt-scroll overflow-x-auto px-6 pb-6">
      <div className="min-w-[1100px]">
        {/* Edit mode toggle */}
        {isAdmin && (
          <div className="flex items-center justify-end px-6 pb-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                editMode
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              {editMode ? "Listo" : "Editar áreas"}
            </button>
          </div>
        )}

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
            editMode={editMode}
          />
        ))}
        {editMode && <AddAreaForm planId={planId} existingColors={areas.map((a) => a.color)} />}
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
  editMode,
}: {
  area: AreaWithItems;
  directions: DirectionData[];
  users: UserOption[];
  onItemClick: (item: ItemWithTasks) => void;
  selectedItemId: string | null;
  editMode: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mb-4">
      {/* Area header */}
      {editMode ? (
        <EditableAreaHeader area={area} />
      ) : (
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
      )}

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

function EditableAreaHeader({ area }: { area: AreaWithItems }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(area.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === area.name) {
      setName(area.name);
      return;
    }
    startTransition(async () => {
      await updateArea(area.id, { name: trimmed });
    });
  }

  function handleColorSelect(color: string) {
    setShowColorPicker(false);
    startTransition(async () => {
      await updateArea(area.id, { color });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteArea(area.id);
    });
  }

  return (
    <div className={`flex items-center gap-2 py-2 ${isPending ? "opacity-50" : ""}`}>
      {/* Clickable color dot */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="h-3 w-3 rounded-sm ring-2 ring-transparent transition-all hover:ring-primary/50"
          style={{ backgroundColor: area.color }}
          title="Cambiar color"
        />
        {showColorPicker && (
          <div className="absolute left-0 top-full z-20 mt-1 flex gap-1.5 rounded-lg border border-border bg-background p-2 shadow-lg">
            {AREA_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleColorSelect(c.value)}
                className={`h-5 w-5 rounded-full transition-transform hover:scale-125 ${
                  c.value === area.color ? "ring-2 ring-primary ring-offset-1" : ""
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editable name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="rounded border border-transparent bg-transparent px-1 text-sm font-bold uppercase tracking-wide text-foreground/70 transition-colors focus:border-primary focus:bg-background focus:outline-none"
      />

      {/* Item count */}
      <span className="text-xs text-muted">
        {area.items.length} iniciativas
      </span>

      {/* Delete */}
      {confirmDelete ? (
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-danger">
            ¿Eliminar área y {area.items.length} iniciativas?
          </span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded bg-danger px-2 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Sí
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            No
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="ml-auto text-muted transition-colors hover:text-danger"
          title="Eliminar área"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      )}
    </div>
  );
}

function AddAreaForm({
  planId,
  existingColors,
}: {
  planId: string;
  existingColors: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => {
    const used = new Set(existingColors);
    return AREA_COLORS.find((c) => !used.has(c.value))?.value ?? AREA_COLORS[0].value;
  });

  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addArea(planId, { name: name.trim(), color });
      setName("");
      setShowForm(false);
    });
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-primary"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agregar área
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-blue-50/30 p-3">
      <div className="flex items-center gap-3">
        {/* Color selector */}
        <div className="flex gap-1.5">
          {AREA_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`h-5 w-5 rounded-full transition-transform hover:scale-125 ${
                c.value === color ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>
      <div className="mt-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del área *"
          className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={() => { setShowForm(false); setName(""); }}
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
