# Gantt Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace dot indicators with real Gantt bars, add inline editing in the drill-down panel, and add a workload heatmap per person below the Gantt.

**Architecture:** Three independent features added to existing components. Gantt bars replace the current `ItemRow`/`TaskDot` rendering. Inline editing enhances the existing `DrillDownPanel`. Workload view is a new `WorkloadView` component rendered below the Gantt grid in `plan-view.tsx`. A new `updateTask` server action is needed for inline editing.

**Tech Stack:** React 19, Tailwind CSS v4, Server Actions, existing Prisma setup.

---

### Task 1: Add `updateTask` server action

**Files:**
- Modify: `src/actions/tasks.ts`

**Step 1: Add the updateTask function**

Add to `src/actions/tasks.ts` after the existing `updateTaskNotes` function:

```typescript
export async function updateTask(
  taskId: string,
  data: {
    name?: string;
    startMonth?: number;
    endMonth?: number;
    notes?: string;
  }
) {
  await prisma.task.update({
    where: { id: taskId },
    data,
  });
  revalidatePath("/");
}
```

**Step 2: Verify build**

Run: `npx next build` (or dev server reload)
Expected: No errors

**Step 3: Commit**

```bash
git add src/actions/tasks.ts
git commit -m "feat: add updateTask server action for inline editing"
```

---

### Task 2: Replace dots with Gantt bars in `ItemRow`

**Files:**
- Modify: `src/components/gantt-view.tsx`

**Step 1: Rewrite the `ItemRow` component**

Replace the current `ItemRow` function (lines 468-538) and remove the `TaskDot` component (lines 541-553). The new `ItemRow`:

- Calculates `minMonth` and `maxMonth` from all tasks
- Computes progress: `completed / total` tasks
- Determines bar color: red if any BLOCKED, green if all COMPLETED, blue if partial, gray if 0%
- Renders a `position: relative` container for the 12-month grid
- Inside, renders an `absolute` div spanning from `minMonth` to `maxMonth` columns
- Bar shows truncated subtheme text inside
- Tooltip on hover shows: full name, progress fraction, responsible name
- Left column: subtheme + responsible initials badge (remove task count text, it's now in the bar)

```tsx
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
  const hasBlocked = item.tasks.some((t) => t.status === "BLOCKED");

  // Calculate bar span
  const minMonth = totalTasks > 0
    ? Math.min(...item.tasks.map((t) => t.startMonth))
    : 0;
  const maxMonth = totalTasks > 0
    ? Math.max(...item.tasks.map((t) => t.endMonth))
    : 0;

  // Bar color based on progress
  let barColor = "#94a3b8"; // gray - not started
  let barBg = "#f1f5f9";
  if (hasBlocked) {
    barColor = "#dc2626"; barBg = "#fee2e2"; // red
  } else if (totalTasks > 0 && completedTasks === totalTasks) {
    barColor = "#16a34a"; barBg = "#dcfce7"; // green
  } else if (completedTasks > 0) {
    barColor = "#2563eb"; barBg = "#dbeafe"; // blue
  }

  const tooltipText = totalTasks > 0
    ? `${item.agenda || item.subtheme}\n${completedTasks}/${totalTasks} tareas${item.responsible ? `\nResp: ${item.responsible.name}` : ""}`
    : "";

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center rounded-lg border transition-all hover:shadow-sm ${
        isSelected
          ? "border-primary-light bg-blue-50/50 shadow-sm"
          : "border-transparent hover:border-border hover:bg-surface"
      }`}
    >
      {/* Item info - left column */}
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
              <span className="truncate">{item.subtheme}</span>
              {item.responsible && (
                <span className="shrink-0 rounded bg-surface-hover px-1.5 py-0.5 font-medium">
                  {item.responsible.initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline grid with bar */}
      <div className="relative flex flex-1">
        {MONTHS.map((_, monthIndex) => (
          <div
            key={monthIndex}
            className="flex-1 border-l border-border/30 py-3"
          />
        ))}
        {totalTasks > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 flex items-center rounded-md px-2 text-xs font-medium transition-opacity"
            style={{
              left: `${((minMonth - 1) / 12) * 100}%`,
              width: `${((maxMonth - minMonth + 1) / 12) * 100}%`,
              backgroundColor: barBg,
              color: barColor,
              border: `1px solid ${barColor}40`,
              height: "24px",
            }}
            title={tooltipText}
          >
            <span className="truncate">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

Delete the `TaskDot` component entirely — it's no longer used.

**Step 2: Verify in browser**

- Start dev server, navigate to Plan view
- Each item should show a horizontal bar instead of dots
- Bar should span the correct months
- Hover should show tooltip
- Click should still open drill-down panel

**Step 3: Commit**

```bash
git add src/components/gantt-view.tsx
git commit -m "feat: replace task dots with Gantt bars showing duration and progress"
```

---

### Task 3: Inline task editing in drill-down panel

**Files:**
- Modify: `src/components/drill-down-panel.tsx`

**Step 1: Create EditableTaskCard to replace TaskCard**

Replace the `TaskCard` component with a new version that supports inline editing of name, months, and notes. Key behaviors:

- **Name:** Render as `<span>` by default. On click, switch to `<input>`. Save on blur/Enter, cancel on Escape. Use `updateTask` action.
- **Months:** Render "Abr – May" as clickable text. On click, show two `<select>` dropdowns inline. Auto-save on change via `updateTask`.
- **Notes:** If notes exist, show as editable `<textarea>` (auto-resize). If empty, show "Agregar nota" link. Save on blur via `updateTask`.
- **Delete:** Add confirmation step (currently deletes immediately). Show "Eliminar?" with Si/No buttons.
- **Status buttons:** Keep unchanged.

```tsx
function TaskCard({ task }: { task: TaskData }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(task.name);
  const [editingMonths, setEditingMonths] = useState(false);
  const [startMonth, setStartMonth] = useState(task.startMonth);
  const [endMonth, setEndMonth] = useState(task.endMonth);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [showNotes, setShowNotes] = useState(!!task.notes);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const config = STATUS_CONFIG[optimisticStatus];

  function handleStatusChange(newStatus: TaskStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateTaskStatus(task.id, newStatus);
    });
  }

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.name) {
      setName(task.name);
      setEditingName(false);
      return;
    }
    setEditingName(false);
    startTransition(async () => {
      await updateTask(task.id, { name: trimmed });
    });
  }

  function saveMonth(field: "startMonth" | "endMonth", value: number) {
    const newStart = field === "startMonth" ? value : startMonth;
    const newEnd = field === "endMonth" ? value : endMonth;
    if (field === "startMonth") {
      setStartMonth(value);
      if (endMonth < value) setEndMonth(value);
    } else {
      setEndMonth(value);
    }
    startTransition(async () => {
      await updateTask(task.id, {
        startMonth: newStart,
        endMonth: Math.max(newEnd, newStart),
      });
    });
  }

  function saveNotes() {
    const trimmed = notes.trim();
    if (trimmed === (task.notes ?? "")) return;
    startTransition(async () => {
      await updateTask(task.id, { notes: trimmed || null });
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <div className={`group rounded-lg border border-border p-3 transition-opacity ${
      isPending || isPendingDelete ? "opacity-60" : ""
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Editable name */}
          {editingName ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") { setName(task.name); setEditingName(false); }
              }}
              className="w-full rounded border border-primary bg-background px-1 py-0.5 text-sm font-medium text-foreground focus:outline-none"
              autoFocus
            />
          ) : (
            <p
              className="cursor-text rounded px-1 py-0.5 text-sm font-medium text-foreground hover:bg-surface-hover"
              onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            >
              {task.name}
            </p>
          )}

          {/* Editable months */}
          {editingMonths ? (
            <div className="mt-0.5 flex items-center gap-1 px-1">
              <select
                value={startMonth}
                onChange={(e) => saveMonth("startMonth", Number(e.target.value))}
                className="rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <span className="text-xs text-muted">–</span>
              <select
                value={endMonth}
                onChange={(e) => saveMonth("endMonth", Number(e.target.value))}
                className="rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1} disabled={i + 1 < startMonth}>{m}</option>
                ))}
              </select>
              <button
                onClick={() => setEditingMonths(false)}
                className="ml-1 text-xs text-muted hover:text-foreground"
              >
                OK
              </button>
            </div>
          ) : (
            <p
              className="mt-0.5 cursor-text rounded px-1 py-0.5 text-xs text-muted hover:bg-surface-hover"
              onClick={(e) => { e.stopPropagation(); setEditingMonths(true); }}
            >
              {MONTHS[task.startMonth - 1]}
              {task.endMonth !== task.startMonth && ` – ${MONTHS[task.endMonth - 1]}`}
            </p>
          )}

          {/* Editable notes */}
          {showNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Agregar nota..."
              rows={2}
              className="mt-1 w-full resize-none rounded border border-border bg-background px-2 py-1 text-xs leading-relaxed text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotes(true); }}
              className="mt-1 px-1 text-xs text-muted/60 hover:text-primary"
            >
              + Nota
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {config.label}
          </span>
          {/* Delete with confirmation */}
          {confirmDelete ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleDelete}
                disabled={isPendingDelete}
                className="rounded bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded px-1.5 py-0.5 text-xs text-muted hover:text-foreground"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 rounded p-0.5 text-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="Eliminar tarea"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status buttons - unchanged */}
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
                isActive ? "ring-1 ring-offset-1" : "opacity-50 hover:opacity-80"
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
```

**Step 2: Add import for `updateTask`**

At the top of `drill-down-panel.tsx`, update the import:
```typescript
import { updateTaskStatus, createTask, deleteTask, updateTask } from "@/actions/tasks";
```

**Step 3: Add inline item editing in panel header**

In the `DrillDownPanel` component, replace the static title/subtitle with editable fields. Add `updateItem` import and state for editing subtheme/agenda/direction:

```typescript
import { updateItem } from "@/actions/items";
```

Replace the header section's static `<h2>` and `<p>` with click-to-edit inputs following the same pattern as task name editing (click → input, blur saves, Escape cancels).

Add a direction dropdown that shows on click, replacing the read-only direction text.

**Step 4: Verify in browser**

- Open drill-down panel for any item
- Click task name → should become editable input
- Click month range → should show dropdowns
- Click "+ Nota" → should show textarea
- Click item title → should become editable
- Verify all saves work (check that page revalidates)

**Step 5: Commit**

```bash
git add src/components/drill-down-panel.tsx
git commit -m "feat: add inline editing for tasks and items in drill-down panel"
```

---

### Task 4: Add inline item editing in panel header

**Files:**
- Modify: `src/components/drill-down-panel.tsx`

This is part of Task 3 but separated for clarity. In the `DrillDownPanel` component:

**Step 1: Add state and edit handlers for item fields**

```tsx
// Inside DrillDownPanel component, add:
const [editingSubtheme, setEditingSubtheme] = useState(false);
const [subtheme, setSubtheme] = useState(item.subtheme);
const [editingAgenda, setEditingAgenda] = useState(false);
const [agenda, setAgenda] = useState(item.agenda ?? "");
```

**Step 2: Replace static header with editable fields**

Replace the header `<h2>` and subtitle `<p>`:

```tsx
{/* Editable title (agenda or subtheme) */}
{editingSubtheme ? (
  <input
    type="text"
    value={subtheme}
    onChange={(e) => setSubtheme(e.target.value)}
    onBlur={() => {
      setEditingSubtheme(false);
      if (subtheme.trim() && subtheme.trim() !== item.subtheme) {
        startAssignTransition(async () => {
          await updateItem(item.id, { subtheme: subtheme.trim() });
        });
      }
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") { setSubtheme(item.subtheme); setEditingSubtheme(false); }
    }}
    className="w-full rounded border border-primary bg-background px-1 py-0.5 text-sm font-bold text-foreground focus:outline-none"
    autoFocus
  />
) : (
  <h2
    className="cursor-text rounded px-1 py-0.5 text-sm font-bold text-foreground hover:bg-surface-hover"
    onClick={() => setEditingSubtheme(true)}
  >
    {item.agenda || item.subtheme}
  </h2>
)}

{/* Editable agenda subtitle */}
{editingAgenda ? (
  <input
    type="text"
    value={agenda}
    onChange={(e) => setAgenda(e.target.value)}
    onBlur={() => {
      setEditingAgenda(false);
      startAssignTransition(async () => {
        await updateItem(item.id, { agenda: agenda.trim() || undefined });
      });
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") { setAgenda(item.agenda ?? ""); setEditingAgenda(false); }
    }}
    placeholder="Agenda (opcional)"
    className="mt-0.5 w-full rounded border border-primary bg-background px-1 py-0.5 text-xs text-foreground focus:outline-none"
    autoFocus
  />
) : (
  <p
    className="mt-0.5 cursor-text rounded px-1 py-0.5 text-xs text-muted hover:bg-surface-hover"
    onClick={() => setEditingAgenda(true)}
  >
    {item.subtheme}
  </p>
)}
```

**Step 3: Add `updateItem` import**

```typescript
import { assignResponsible, deleteItem, updateItem } from "@/actions/items";
```

**Step 4: Verify and commit**

```bash
git add src/components/drill-down-panel.tsx
git commit -m "feat: add inline editing for item subtheme and agenda in panel header"
```

---

### Task 5: Workload heatmap component

**Files:**
- Create: `src/components/workload-view.tsx`
- Modify: `src/components/plan-view.tsx`

**Step 1: Create the WorkloadView component**

Create `src/components/workload-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MONTHS } from "@/lib/types";
import type { AreaWithItems } from "@/lib/types";

type PersonLoad = {
  name: string;
  initials: string | null;
  months: number[]; // tasks per month (index 0 = Jan)
};

function computeWorkload(areas: AreaWithItems[]): PersonLoad[] {
  const byPerson = new Map<string, PersonLoad>();

  for (const area of areas) {
    for (const item of area.items) {
      if (!item.responsible) continue;
      const key = item.responsible.id;
      if (!byPerson.has(key)) {
        byPerson.set(key, {
          name: item.responsible.name,
          initials: item.responsible.initials,
          months: new Array(12).fill(0),
        });
      }
      const person = byPerson.get(key)!;
      for (const task of item.tasks) {
        for (let m = task.startMonth - 1; m <= task.endMonth - 1; m++) {
          person.months[m]++;
        }
      }
    }
  }

  return Array.from(byPerson.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getCellStyle(count: number): { bg: string; text: string } {
  if (count === 0) return { bg: "transparent", text: "#94a3b8" };
  if (count <= 2) return { bg: "#dcfce7", text: "#16a34a" };
  if (count <= 4) return { bg: "#fef9c3", text: "#a16207" };
  return { bg: "#fee2e2", text: "#dc2626" };
}

export function WorkloadView({ areas }: { areas: AreaWithItems[] }) {
  const [expanded, setExpanded] = useState(false);
  const workload = computeWorkload(areas);

  if (workload.length === 0) return null;

  return (
    <div className="mx-6 mb-6 min-w-[1100px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-lg border border-border/50 px-4 py-2 text-left text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface"
      >
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        Carga por persona
        <span className="text-xs font-normal text-muted">
          ({workload.length} personas)
        </span>
      </button>

      {expanded && (
        <div className="mt-1 rounded-lg border border-border/50">
          {workload.map((person) => (
            <div key={person.name} className="flex items-center border-b border-border/30 last:border-b-0">
              {/* Person name */}
              <div className="w-72 shrink-0 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-medium text-foreground">
                    {person.initials || person.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate text-sm text-foreground">
                    {person.name}
                  </span>
                </div>
              </div>
              {/* Month cells */}
              <div className="flex flex-1">
                {person.months.map((count, i) => {
                  const style = getCellStyle(count);
                  return (
                    <div
                      key={i}
                      className="flex flex-1 items-center justify-center border-l border-border/30 py-2 text-xs font-semibold"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                      }}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-4 border-t border-border/30 px-4 py-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#dcfce7" }} />
              1-2
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fef9c3" }} />
              3-4
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fee2e2" }} />
              5+
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add WorkloadView to plan-view.tsx**

In `src/components/plan-view.tsx`, import and render after the GanttView:

```tsx
import { WorkloadView } from "@/components/workload-view";
```

Place it inside the scrollable area, after `<GanttView>`:

```tsx
<div className="flex-1 overflow-y-auto">
  <GanttView ... />
  <WorkloadView areas={plan.areas} />
</div>
```

**Step 3: Verify in browser**

- Scroll below the Gantt grid
- Should see "Carga por persona" collapsed header
- Click to expand → shows heatmap with person rows and month columns
- Color coding: green (1-2), yellow (3-4), red (5+)
- Legend at bottom

**Step 4: Commit**

```bash
git add src/components/workload-view.tsx src/components/plan-view.tsx
git commit -m "feat: add workload heatmap showing task load per person per month"
```

---

### Task 6: Final verification and deploy

**Step 1: Full browser verification**

- Gantt bars display correctly for all items
- Click bar opens drill-down panel
- Edit task name, months, notes inline
- Edit item title and agenda inline
- Status buttons still work
- Workload heatmap shows correct data
- Mobile responsive (panel overlay still works)

**Step 2: Commit any fixes and push**

```bash
git push origin main
```

**Step 3: Update ROADMAP.md**

Add Sprint 8 entry documenting the three features completed.
