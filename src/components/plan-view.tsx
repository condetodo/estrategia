"use client";

import { useState } from "react";
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
  const [selectedItem, setSelectedItem] = useState<ItemWithTasks | null>(null);

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
            onItemClick={setSelectedItem}
            selectedItemId={selectedItem?.id ?? null}
          />
          <WorkloadView areas={plan.areas} />
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
