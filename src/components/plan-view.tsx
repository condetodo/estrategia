"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { DirectionsBar } from "@/components/directions-bar";
import { GanttView } from "@/components/gantt-view";
import { DrillDownPanel } from "@/components/drill-down-panel";
import type { PlanWithDetails, ItemWithTasks, UserOption } from "@/lib/types";

export function PlanView({
  plan,
  users,
}: {
  plan: PlanWithDetails;
  users: UserOption[];
}) {
  const [selectedItem, setSelectedItem] = useState<ItemWithTasks | null>(null);

  const activeDirectionId = selectedItem?.direction?.id ?? null;

  return (
    <div className="flex h-screen flex-col">
      <Header company={plan.company} year={plan.year} />

      <DirectionsBar
        directions={plan.directions}
        activeDirectionId={activeDirectionId}
      />

      <div className="relative flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <GanttView
            areas={plan.areas}
            directions={plan.directions}
            users={users}
            onItemClick={setSelectedItem}
            selectedItemId={selectedItem?.id ?? null}
          />
        </div>

        {selectedItem && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              onClick={() => setSelectedItem(null)}
            />
            <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm lg:relative lg:inset-auto lg:z-auto lg:w-96 lg:max-w-none">
              <DrillDownPanel
                key={selectedItem.id}
                item={selectedItem}
                users={users}
                onClose={() => setSelectedItem(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
