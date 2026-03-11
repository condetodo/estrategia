"use client";

import type { DirectionData } from "@/lib/types";

export function DirectionsBar({
  directions,
  activeDirectionId,
}: {
  directions: DirectionData[];
  activeDirectionId: string | null;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 px-6 py-4">
      {directions.map((dir) => {
        const isActive = dir.id === activeDirectionId;
        return (
          <div
            key={dir.id}
            className={`rounded-lg border px-3 py-2.5 transition-all ${
              isActive
                ? "border-primary-light bg-blue-50 shadow-sm"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isActive ? "bg-primary-light" : "bg-muted"
                }`}
              >
                {dir.number}
              </span>
              <p className="text-xs leading-snug text-foreground/80">
                {dir.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
