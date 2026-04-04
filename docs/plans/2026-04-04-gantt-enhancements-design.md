# Gantt Enhancements Design

**Date:** 2026-04-04
**Status:** Approved

## Overview

Three enhancements to maximize the Gantt chart functionality:
1. Real Gantt bars (replacing dot indicators)
2. Inline task/item editing in the drill-down panel
3. Workload view per person

## 1. Real Gantt Bars

**Current:** Each item row shows small colored dots per task per month.
**New:** Each item row shows ONE continuous horizontal bar spanning from earliest task startMonth to latest task endMonth.

### Bar behavior
- Rendered as `position: absolute` div within the 12-column month grid
- Spans from min(tasks.startMonth) to max(tasks.endMonth)
- Color by progress state:
  - Gray: 0% tasks completed
  - Blue: partial completion
  - Green: 100% completed
  - Red: any task is BLOCKED
- Bar text: truncated subtheme name
- Hover tooltip: full name, progress (e.g., "3/5 tareas"), responsible
- Click: opens drill-down panel (existing behavior)
- No tasks = no bar, only left-column label

### Left column simplification
- Shows: subtheme + responsible initials badge
- Removes: task count (now visible in bar/tooltip)

## 2. Inline Task/Item Editing in Drill-Down Panel

### Task editing (each TaskCard)
- **Name:** click text → input, save on blur/Enter, cancel on Escape
- **Months:** click "Abr – May" → two dropdowns (start, end), auto-save on change
- **Notes:** expandable text field, always visible if has content, click to add if empty, save on blur
- **Status:** unchanged (4 buttons)
- **Delete:** unchanged but add confirmation dialog

### Item editing (panel header)
- **Subtheme:** click title → input editable
- **Agenda:** click subtitle → input editable
- **Direction:** click → dropdown selector (currently read-only text)
- **Responsible:** already works (no change)

### Server actions needed
- `updateTask(taskId, { name?, startMonth?, endMonth?, notes? })` — new action
- `updateItem(itemId, data)` — already exists

## 3. Workload View Per Person

### Location
- Collapsible section below the Gantt grid
- Collapsed by default, toggle with click on header

### Layout
- Header: "Carga por persona" with expand/collapse toggle
- One row per user who has assigned items (via item.responsibleId)
- Same 12-month grid aligned with Gantt above
- Each cell: number showing active tasks for that person in that month

### Color coding by density
- White: 0 tasks
- Light green: 1-2 tasks
- Yellow: 3-4 tasks
- Red: 5+ tasks (overload indicator)

### Data calculation
- Client-side: traverse areas → items → tasks
- Group by item.responsible
- Count tasks where startMonth <= month <= endMonth

### Future enhancement (not in this sprint)
- Click cell to filter Gantt by that person
