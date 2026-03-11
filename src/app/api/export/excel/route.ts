import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import type { PlanWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/excel
 * Exports the active plan as an Excel file.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const plan = await prisma.strategicPlan.findFirst({
    where: { status: "ACTIVE" },
    include: {
      directions: { orderBy: { number: "asc" } },
      areas: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              tasks: { orderBy: { startMonth: "asc" } },
              responsible: { select: { initials: true, name: true } },
              direction: { select: { number: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "No hay plan activo" }, { status: 400 });
  }

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  // Build spreadsheet data
  const headers = [
    "Área", "Subtema", "Agenda", "Dir.", "Responsable",
    ...months,
    "Estado General",
  ];

  const rows: any[][] = [headers];

  for (const area of plan.areas) {
    for (const item of area.items) {
      const row: any[] = [
        area.name,
        item.subtheme,
        item.agenda ?? "",
        item.direction?.number ?? "",
        item.responsible?.initials ?? "",
      ];

      // Month columns — show task names for each month
      for (let m = 1; m <= 12; m++) {
        const monthTasks = item.tasks.filter(
          (t) => m >= t.startMonth && m <= t.endMonth
        );
        row.push(monthTasks.map((t) => t.name).join(", ") || "");
      }

      // Status summary
      const total = item.tasks.length;
      const completed = item.tasks.filter((t) => t.status === "COMPLETED").length;
      row.push(total > 0 ? `${completed}/${total} (${Math.round((completed / total) * 100)}%)` : "—");

      rows.push(row);
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 16 }, // Area
    { wch: 28 }, // Subtheme
    { wch: 40 }, // Agenda
    { wch: 5 },  // Dir
    { wch: 8 },  // Responsible
    ...months.map(() => ({ wch: 18 })), // Months
    { wch: 14 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Plan ${plan.year}`);

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="plan-estrategico-${plan.year}.xlsx"`,
    },
  });
}
