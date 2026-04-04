"use client";

import { useState } from "react";
import { MONTHS } from "@/lib/types";
import type { AreaWithItems } from "@/lib/types";

type PersonWorkload = {
  id: string;
  name: string;
  initials: string | null;
  counts: number[]; // 12 months, 0-indexed
};

function computeWorkload(areas: AreaWithItems[]): PersonWorkload[] {
  const map = new Map<string, PersonWorkload>();

  for (const area of areas) {
    for (const item of area.items) {
      if (!item.responsible) continue;
      const { id, name, initials } = item.responsible;

      let person = map.get(id);
      if (!person) {
        person = { id, name, initials, counts: new Array(12).fill(0) };
        map.set(id, person);
      }

      for (const task of item.tasks) {
        for (let m = task.startMonth; m <= task.endMonth; m++) {
          if (m >= 1 && m <= 12) {
            person.counts[m - 1]++;
          }
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function cellStyle(count: number): { bg: string; text: string } {
  if (count === 0) return { bg: "transparent", text: "" };
  if (count <= 2) return { bg: "#dcfce7", text: "#16a34a" };
  if (count <= 4) return { bg: "#fef9c3", text: "#a16207" };
  return { bg: "#fee2e2", text: "#dc2626" };
}

export function WorkloadView({ areas }: { areas: AreaWithItems[] }) {
  const [expanded, setExpanded] = useState(false);
  const people = computeWorkload(areas);

  if (people.length === 0) return null;

  return (
    <div className="mx-6 mb-6">
      <div className="min-w-[1100px]">
        {/* Header toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </svg>
          Carga por persona
        </button>

        {expanded && (
          <div className="mt-2">
            {/* Month headers */}
            <div className="flex">
              <div className="w-72 shrink-0" />
              {MONTHS.map((m) => (
                <div
                  key={m}
                  className="flex-1 text-center text-xs font-medium text-muted py-1"
                >
                  {m}
                </div>
              ))}
            </div>

            {/* Person rows */}
            {people.map((person) => (
              <div key={person.id} className="flex items-center border-t border-border/50">
                <div className="w-72 shrink-0 flex items-center gap-2 px-3 py-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {person.initials ?? person.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-xs text-foreground truncate">{person.name}</span>
                </div>
                {person.counts.map((count, i) => {
                  const style = cellStyle(count);
                  return (
                    <div
                      key={i}
                      className="flex-1 flex items-center justify-center py-1.5"
                    >
                      {count > 0 && (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 px-3 text-xs text-muted">
              <span>Leyenda:</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: "#dcfce7" }}
                />
                1-2
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: "#fef9c3" }}
                />
                3-4
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: "#fee2e2" }}
                />
                5+
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
