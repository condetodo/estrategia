import type { PlanStats } from "@/lib/stats";

type KpiDef = {
  label: string;
  key: keyof Pick<PlanStats, "total" | "completed" | "inProgress" | "blocked">;
  color: string;
  bg: string;
  icon: string;
};

const kpis: KpiDef[] = [
  { label: "Total tareas", key: "total", color: "#1e3a5f", bg: "#e0e7ef", icon: "📋" },
  { label: "Completadas", key: "completed", color: "#16a34a", bg: "#dcfce7", icon: "✅" },
  { label: "En curso", key: "inProgress", color: "#2563eb", bg: "#dbeafe", icon: "🔄" },
  { label: "Bloqueadas", key: "blocked", color: "#dc2626", bg: "#fee2e2", icon: "🚫" },
];

export function KpiCards({ stats }: { stats: PlanStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="rounded-xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">{kpi.label}</span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: kpi.bg }}
            >
              {kpi.icon}
            </span>
          </div>
          <p
            className="mt-2 text-3xl font-bold tracking-tight"
            style={{ color: kpi.color }}
          >
            {stats[kpi.key]}
          </p>
          {kpi.key === "completed" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Avance general</span>
                <span className="font-semibold" style={{ color: kpi.color }}>
                  {stats.completionPct}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-border">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.completionPct}%`,
                    backgroundColor: kpi.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
