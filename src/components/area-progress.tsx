import type { AreaStats } from "@/lib/stats";

function ProgressRing({
  pct,
  color,
  size = 80,
  strokeWidth = 7,
}: {
  pct: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-sm font-bold"
      >
        {pct}%
      </text>
    </svg>
  );
}

export function AreaProgress({ areas }: { areas: AreaStats[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
        Avance por Área
      </h3>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {areas.map((area) => (
          <div key={area.areaId} className="flex flex-col items-center gap-2">
            <ProgressRing pct={area.pct} color={area.areaColor} />
            <span className="text-center text-sm font-medium text-foreground">
              {area.areaName}
            </span>
            <span className="text-xs text-muted">
              {area.completed}/{area.total} tareas
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
