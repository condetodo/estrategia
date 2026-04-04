"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";

import { GanttView } from "@/components/gantt-view";
import { WorkloadView } from "@/components/workload-view";
import { DrillDownPanel } from "@/components/drill-down-panel";
import type { PlanWithDetails, ItemWithTasks, UserOption } from "@/lib/types";

export function PlanView({
  plan,
  users,
  isAdmin,
}: {
  plan: PlanWithDetails;
  users: UserOption[];
  isAdmin: boolean;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Derive selectedItem from fresh server data to avoid stale state
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    for (const area of plan.areas) {
      const found = area.items.find((item) => item.id === selectedItemId);
      if (found) return found;
    }
    return null; // item was deleted
  }, [selectedItemId, plan.areas]);

  return (
    <div className="flex h-screen flex-col">
      <Header company={plan.company} year={plan.year} />

      <div className="relative flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <GanttView
            areas={plan.areas}
            directions={plan.directions}
            users={users}
            planId={plan.id}
            isAdmin={isAdmin}
            onItemClick={(item) => setSelectedItemId(item.id)}
            selectedItemId={selectedItemId}
          />
          <WorkloadView areas={plan.areas} />
        </div>

        {selectedItem && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              onClick={() => setSelectedItemId(null)}
            />
            <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm lg:relative lg:inset-auto lg:z-auto lg:w-96 lg:max-w-none">
              <DrillDownPanel
                key={selectedItem.id}
                item={selectedItem}
                users={users}
                onClose={() => setSelectedItemId(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
