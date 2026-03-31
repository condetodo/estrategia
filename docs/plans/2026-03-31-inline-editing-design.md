# Inline Editing - Design Document

**Date**: 2026-03-31
**Status**: Approved
**Goal**: Make everything in the active plan editable inline, and improve visual clarity between directions and areas.

## Approach: Edit-in-place (Enfoque A)

Edit data where it's displayed, no modals. Reuse existing components with edit modes.

---

## Section 1: Visual Clarity + Header & Directions Editing

### Plan Header ("Agro Patagónico 2026")
- Click on header text → converts to two inputs (company + year) with save/cancel
- New server action: `updatePlan(planId, { company, year })`

### Directions Bar
- Add a subtle label **"Direcciones Estratégicas"** above the bar for clarity
- Click on direction text → converts to editable textarea
- **"+ Agregar"** button at end of row to create new directions
- **"x"** button on each card to delete a direction
- New server actions: `createDirection()`, `updateDirection()`, `deleteDirection()`
  - Replace current batch-only `setDirections()` with individual CRUD operations

### Area Headers in Gantt
- Add visual separator/label to distinguish areas from directions
- Area name (e.g., "PLANTA") → click to edit inline
- Area color dot → click to change color
- **"+ Agregar Área"** button at bottom
- **"x"** button to delete area (with confirmation if it has items)
- New server actions: `createArea()`, `updateArea()`, `deleteArea()`
  - Replace current batch-only `setAreas()` with individual CRUD operations

---

## Section 2: Item (Initiative) Editing in Drill-Down Panel

### Edit Mode Toggle
- Add **"Editar"** button in the drill-down panel header
- Clicking it puts all fields into edit mode with a **"Guardar"** / **"Cancelar"** button pair

### Editable Fields (in edit mode)
- **Subtheme**: text input
- **Agenda**: text input
- **Direction**: dropdown selector (link to direction)
- **Responsible**: dropdown selector (already works today)

### Existing Capabilities
- `updateItem()` server action already supports: subtheme, agenda, directionId, responsibleId
- No new server actions needed for items

---

## Section 3: Task Editing in Drill-Down Panel

### Edit Mode per Task
- **"Editar"** button (pencil icon) next to each task row
- Clicking it converts that task's row into editable fields

### Editable Fields
- **Name**: text input
- **Start month**: month selector (1-12)
- **End month**: month selector (1-12)
- **Notes**: textarea
- **Status**: already editable via status buttons (no change needed)

### New Server Actions Needed
- `updateTask(taskId, { name, startMonth, endMonth, notes })` — currently only `updateTaskStatus()` and `updateTaskNotes()` exist, need a unified update action

---

## Section 4: Summary of New Server Actions

| Action | Entity | Purpose |
|--------|--------|---------|
| `updatePlan()` | Plan | Edit company name, year |
| `createDirection()` | Direction | Add new direction to active plan |
| `updateDirection()` | Direction | Edit direction description |
| `deleteDirection()` | Direction | Remove direction |
| `createArea()` | Area | Add new area to active plan |
| `updateArea()` | Area | Edit area name, color |
| `deleteArea()` | Area | Remove area (cascade items?) |
| `updateTask()` | Task | Edit name, startMonth, endMonth, notes |

### Existing Actions (no changes needed)
- `createItem()`, `updateItem()`, `deleteItem()`, `assignResponsible()`
- `createTask()`, `deleteTask()`, `updateTaskStatus()`, `updateTaskNotes()`

---

## Section 5: UX Patterns

1. **Inline text editing**: Click text → input appears → Enter or blur to save, Escape to cancel
2. **Panel edit mode**: Button toggles all fields to inputs → explicit Save/Cancel
3. **Optimistic updates**: Update UI immediately, revert on error
4. **Confirmations**: Required for delete operations on entities with children (areas with items, items with tasks)
5. **Visual feedback**: Loading states during save, success flash on completion

---

## Files to Modify

### New/Modified Server Actions
- `/src/actions/plans.ts` — add `updatePlan()`
- `/src/actions/directions.ts` — new file: `createDirection()`, `updateDirection()`, `deleteDirection()`
- `/src/actions/areas.ts` — new file: `createArea()`, `updateArea()`, `deleteArea()`
- `/src/actions/tasks.ts` — add `updateTask()`

### UI Components
- `/src/components/header.tsx` or equivalent — editable plan name/year
- `/src/components/directions-bar.tsx` — inline editing, add/delete buttons, label
- `/src/components/gantt-view.tsx` — editable area headers, add/delete area
- `/src/components/drill-down-panel.tsx` — edit mode for items, edit mode for tasks
