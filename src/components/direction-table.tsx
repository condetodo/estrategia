import type { DirectionStats } from "@/lib/stats";

export function DirectionTable({ directions }: { directions: DirectionStats[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
        Resumen por Dirección Estratégica
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="pb-3 pr-4 font-semibold">Dirección</th>
              <th className="pb-3 pr-4 text-center font-semibold">Tareas</th>
              <th className="pb-3 pr-4 text-center font-semibold">Completadas</th>
              <th className="pb-3 pr-4 font-semibold">Avance</th>
              <th className="pb-3 font-semibold">Subtemas</th>
            </tr>
          </thead>
          <tbody>
            {directions.map((dir) => (
              <tr key={dir.directionId} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {dir.number}
                    </span>
                    <span className="font-medium text-foreground">{dir.description}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-center text-muted">{dir.totalTasks}</td>
                <td className="py-3 pr-4 text-center text-muted">{dir.completedTasks}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-border">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${dir.pct}%`,
                          backgroundColor:
                            dir.pct >= 75
                              ? "#16a34a"
                              : dir.pct >= 40
                                ? "#2563eb"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted">{dir.pct}%</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {dir.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor:
                            item.pct >= 75
                              ? "#dcfce7"
                              : item.pct >= 40
                                ? "#dbeafe"
                                : "#fef3c7",
                          color:
                            item.pct >= 75
                              ? "#16a34a"
                              : item.pct >= 40
                                ? "#2563eb"
                                : "#d97706",
                        }}
                        title={`${item.subtheme}: ${item.pct}%`}
                      >
                        {item.subtheme.length > 25
                          ? item.subtheme.slice(0, 25) + "…"
                          : item.subtheme}
                        <span className="font-semibold">{item.pct}%</span>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
