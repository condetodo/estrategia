"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { MonthlyData } from "@/lib/stats";

export function MonthlyChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
        Avance Mensual Acumulado
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
            />
            <Area
              type="monotone"
              dataKey="planned"
              name="Planificadas"
              stroke="#94a3b8"
              strokeWidth={2}
              fill="url(#gradPlanned)"
              dot={{ r: 3, fill: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completadas"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#gradCompleted)"
              dot={{ r: 3, fill: "#16a34a" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
