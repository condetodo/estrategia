"use client";

import { Header } from "@/components/header";
import { KpiCards } from "@/components/kpi-cards";
import { AreaProgress } from "@/components/area-progress";
import { MonthlyChart } from "@/components/monthly-chart";
import { DirectionTable } from "@/components/direction-table";
import type { PlanStats, AreaStats, DirectionStats, MonthlyData } from "@/lib/stats";

type DashboardViewProps = {
  company: string;
  year: number;
  planStats: PlanStats;
  areaStats: AreaStats[];
  directionStats: DirectionStats[];
  monthlyData: MonthlyData[];
};

export function DashboardView({
  company,
  year,
  planStats,
  areaStats,
  directionStats,
  monthlyData,
}: DashboardViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header company={company} year={year} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* KPI Cards */}
          <KpiCards stats={planStats} />

          {/* Area Progress + Monthly Chart side by side on large screens */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AreaProgress areas={areaStats} />
            <MonthlyChart data={monthlyData} />
          </div>

          {/* Direction Summary Table - full width */}
          <DirectionTable directions={directionStats} />
        </div>
      </main>
    </div>
  );
}
