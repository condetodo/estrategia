# Inline Area Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to add, rename, recolor, and delete areas directly in the Gantt view via an edit-mode toggle.

**Architecture:** A new `src/actions/areas.ts` file with 3 server actions (add, update, delete). The existing `gantt-view.tsx` gains an `editMode` state that transforms area headers into editable inputs. The server page passes `isAdmin` down so the toggle is admin-only.

**Tech Stack:** Next.js 15 Server Actions, React 19 `useTransition`, Prisma 7, Tailwind CSS v4

---

### Task 1: Create area server actions

**Files:**
- Create: `src/actions/areas.ts`

**Step 1: Create `src/actions/areas.ts` with three server actions**

Follow the exact pattern from `src/actions/items.ts` (same imports, `revalidatePath("/")` after each mutation).

```typescript
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
```

**Step 2: Commit**

```bash
git add src/actions/areas.ts
git commit -m "feat: add server actions for area CRUD"
```

---

### Task 2: Pass `isAdmin` prop through to GanttView

**Files:**
- Modify: `src/app/page.tsx` (line 67)
- Modify: `src/components/plan-view.tsx` (lines 10-17, 31)
- Modify: `src/components/gantt-view.tsx` (props of GanttView)

**Step 1: In `src/app/page.tsx`, compute `isAdmin` and pass to `PlanView`**

After the `if (!plan)` block (line 66), before the return, add:

```typescript
  const isAdmin = (session.user as any).role === "ADMIN";

  return <PlanView plan={plan as PlanWithDetails} users={users} isAdmin={isAdmin} />;
```

**Step 2: In `src/components/plan-view.tsx`, accept and forward `isAdmin`**

Update the props type and forward to `GanttView`:

```typescript
export function PlanView({
  plan,
  users,
  isAdmin,
}: {
  plan: PlanWithDetails;
  users: UserOption[];
  isAdmin: boolean;
}) {
```

Pass `isAdmin` and `planId` to GanttView:

```tsx
<GanttView
  areas={plan.areas}
  directions={plan.directions}
  users={users}
  planId={plan.id}
  isAdmin={isAdmin}
  onItemClick={setSelectedItem}
  selectedItemId={selectedItem?.id ?? null}
/>
```

**Step 3: In `src/components/gantt-view.tsx`, add `planId` and `isAdmin` to GanttView props**

Update the GanttView function signature:

```typescript
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
```

Don't use `planId` or `isAdmin` yet — just thread the props through.

**Step 4: Verify the app still compiles**

Run: `npx next build` or `npm run dev` and check no type errors.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/plan-view.tsx src/components/gantt-view.tsx
git commit -m "feat: thread isAdmin and planId props to GanttView"
```

---

### Task 3: Add edit-mode toggle and editable area headers

**Files:**
- Modify: `src/components/gantt-view.tsx`

This is the main UI task. Add `editMode` state to GanttView, a toggle button, and transform `AreaSection` headers.

**Step 1: Add editMode state and toggle button to GanttView**

Inside the `GanttView` function body, add state:

```typescript
const [editMode, setEditMode] = useState(false);
```

Add the import for `addArea`, `updateArea`, `deleteArea`:

```typescript
import { addArea, updateArea, deleteArea } from "@/actions/areas";
import { AREA_COLORS } from "@/lib/types";
```

Before the month headers div (`<div className="sticky top-0 ...`), add an edit toggle row:

```tsx
{/* Edit mode toggle — admin only */}
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
```

**Step 2: Pass `editMode` and `planId` to each `AreaSection`**

Update the AreaSection rendering in the areas map:

```tsx
{areas.map((area) => (
  <AreaSection
    key={area.id}
    area={area}
    directions={directions}
    users={users}
    editMode={editMode}
    onItemClick={onItemClick}
    selectedItemId={selectedItemId}
  />
))}
```

After the areas map, add the AddAreaForm (only in edit mode):

```tsx
{editMode && (
  <AddAreaForm planId={planId} existingColors={areas.map((a) => a.color)} />
)}
```

**Step 3: Update `AreaSection` to support edit mode**

Update the AreaSection function signature to accept `editMode`:

```typescript
function AreaSection({
  area,
  directions,
  users,
  editMode,
  onItemClick,
  selectedItemId,
}: {
  area: AreaWithItems;
  directions: DirectionData[];
  users: UserOption[];
  editMode: boolean;
  onItemClick: (item: ItemWithTasks) => void;
  selectedItemId: string | null;
}) {
```

Replace the area header div (the one with `h-3 w-3 rounded-sm` color dot and `h3`) with a conditional:

```tsx
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
```

**Step 4: Create the `EditableAreaHeader` component**

Add this new function component in `gantt-view.tsx`:

```typescript
function EditableAreaHeader({ area }: { area: AreaWithItems }) {
  const [name, setName] = useState(area.name);
  const [isPending, startTransition] = useTransition();
  const [showColors, setShowColors] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  function handleNameSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === area.name) {
      setName(area.name);
      return;
    }
    startTransition(async () => {
      await updateArea(area.id, { name: trimmed });
    });
  }

  function handleColorChange(color: string) {
    setShowColors(false);
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
      {/* Color button */}
      <div className="relative">
        <button
          onClick={() => setShowColors(!showColors)}
          className="h-4 w-4 rounded-sm border border-border/50 transition-transform hover:scale-110"
          style={{ backgroundColor: area.color }}
          title="Cambiar color"
        />
        {showColors && (
          <div className="absolute left-0 top-6 z-20 flex gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
            {AREA_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleColorChange(c.value)}
                className={`h-5 w-5 rounded-full border-2 transition-all ${
                  area.color === c.value
                    ? "border-foreground scale-110"
                    : "border-transparent hover:border-muted"
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
        onBlur={handleNameSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="rounded border border-border bg-background px-2 py-0.5 text-sm font-bold uppercase tracking-wide text-foreground/70 focus:border-primary focus:outline-none"
        style={{ width: `${Math.max(name.length, 5) + 2}ch` }}
      />

      <span className="text-xs text-muted">
        {area.items.length} iniciativas
      </span>

      {/* Delete button */}
      {showConfirmDelete ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-500">
            ¿Eliminar área y {area.items.length} iniciativas?
          </span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            Sí
          </button>
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="rounded px-2 py-0.5 text-xs text-muted hover:text-foreground"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
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
```

**Step 5: Create the `AddAreaForm` component**

Add this function component in `gantt-view.tsx` (follows the same pattern as `AddItemForm`):

```typescript
function AddAreaForm({
  planId,
  existingColors,
}: {
  planId: string;
  existingColors: string[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => {
    const used = new Set(existingColors);
    return AREA_COLORS.find((c) => !used.has(c.value))?.value ?? AREA_COLORS[0].value;
  });
  const [isPending, startTransition] = useTransition();

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
      <div className="mb-4 px-0">
        <button
          onClick={() => setShowForm(true)}
          className="mt-1 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar área
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-blue-50/30 p-3">
      <div className="flex items-center gap-3">
        {/* Color selector */}
        <div className="flex shrink-0 flex-wrap gap-1">
          {AREA_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`h-5 w-5 rounded-full border-2 transition-all ${
                color === c.value
                  ? "border-foreground scale-110"
                  : "border-transparent hover:border-muted"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del área *"
          className="flex-1 rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
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
```

**Step 6: Verify the app compiles and the edit mode works**

Run: `npm run dev`, navigate to the plan, click "Editar áreas", verify:
- Area names become editable inputs
- Color picker appears on click
- Delete button with confirmation works
- Add area form appears at the bottom
- "Listo" button exits edit mode

**Step 7: Commit**

```bash
git add src/components/gantt-view.tsx
git commit -m "feat: add inline area editing with edit mode toggle"
```

---

### Task 4: Update ROADMAP.md

**Files:**
- Modify: `ROADMAP.md`

**Step 1: Add entry under Post-MVP**

Change `- [ ] Vista por rol` section. Add a new completed item at the top of the post-MVP list:

```markdown
## Sprint 7: Inline Area Editing
- [x] 7.1 Server actions para CRUD de áreas (add, update, delete)
- [x] 7.2 Toggle "Editar áreas" en Gantt (admin-only)
- [x] 7.3 Area headers editables (nombre, color, eliminar con cascada)
- [x] 7.4 Formulario inline para agregar área nueva
```

**Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "docs: update roadmap with Sprint 7 area editing"
```
