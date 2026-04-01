# Inline Area Editing in Gantt View

## Summary

Add CRUD operations for areas directly in the Gantt view via an "edit mode" toggle. Admins can add, rename, recolor, and delete areas without leaving the plan view.

## UX Flow

1. **Toggle button** "Editar areas" appears above the Gantt (near month headers). Admin-only.
2. **Edit mode ON**: each area header shows an editable name input, color selector dots, and a delete button. A "+ Agregar area" form appears at the bottom.
3. **Delete area**: confirm dialog warns about cascading deletion of items/tasks.
4. **"Listo" button**: exits edit mode, returns to normal view.

## Technical Changes

### New file: `src/actions/areas.ts`
Server actions for area mutations:
- `addArea(planId, { name, color })` — creates area with next order value
- `updateArea(areaId, { name?, color? })` — partial update
- `deleteArea(areaId)` — deletes with cascade (items + tasks)

### Modified: `src/components/gantt-view.tsx`
- Add `editMode` state + toggle button in header area
- Pass `editMode` and `planId` to `AreaSection`
- Add `AddAreaForm` component at the bottom when in edit mode

### Modified: `src/components/gantt-view.tsx` — `AreaSection`
- When `editMode` is true, area name becomes an input, color dots appear, delete icon appears
- Inline save on blur/enter for name changes
- Color change saves immediately on click

### No schema changes
Prisma schema already has `onDelete: Cascade` on Area -> Item -> Task relations.

## Out of Scope
- Drag & drop reordering of areas
- Editing directions (separate feature)
- Non-admin editing
