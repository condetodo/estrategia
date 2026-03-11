"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { DirectionsBar } from "@/components/directions-bar";
import { GanttView } from "@/components/gantt-view";
import { DrillDownPanel } from "@/components/drill-down-panel";
import type { PlanWithDetails, ItemWithTasks } from "@/lib/types";

export function PlanView({ plan }: { plan: PlanWithDetails }) {
  const [selectedItem, setSelectedItem] = useState<ItemWithTasks | null>(null);

  const activeDirectionId = selectedItem?.direction?.id ?? null;

  return (
    <div className="flex h-screen flex-col">
      <Header company={plan.company} year={plan.year} />

      <DirectionsBar
        directions={plan.directions}
        activeDirectionId={activeDirectionId}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <GanttView
            areas={plan.areas}
            onItemClick={setSelectedItem}
            selectedItemId={selectedItem?.id ?? null}
          />
        </div>

        {selectedItem && (
          <DrillDownPanel
            key={selectedItem.id}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </div>
  );
}
