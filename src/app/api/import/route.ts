import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

/**
 * POST /api/import
 * Imports an Excel file with strategic plan data.
 *
 * Expected sheet structure (row-based):
 * Row 1: Header row (ignored)
 * Rows 2+: Area | Subtheme | Agenda | Direction# | Responsible | Month columns (1-12)
 *
 * Month columns contain task names. Empty cells = no task for that month.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Only ADMIN can import
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo administradores pueden importar" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "El archivo está vacío o no tiene datos" },
        { status: 400 }
      );
    }

    // Get the active plan
    const plan = await prisma.strategicPlan.findFirst({
      where: { status: "ACTIVE" },
      include: {
        directions: true,
        areas: { include: { items: { include: { tasks: true } } } },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "No hay plan activo" },
        { status: 400 }
      );
    }

    // Build lookup maps
    const directionMap = new Map(plan.directions.map((d) => [d.number, d.id]));
    const areaMap = new Map(plan.areas.map((a) => [a.name.toLowerCase(), a.id]));
    const users = await prisma.user.findMany({
      select: { id: true, initials: true, name: true },
    });
    const userMap = new Map(
      users.flatMap((u) => [
        [u.initials?.toLowerCase() ?? "", u.id],
        [u.name.toLowerCase(), u.id],
      ])
    );

    // Parse rows (skip header)
    const header = rows[0];
    let imported = 0;
    let skipped = 0;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 3) {
        skipped++;
        continue;
      }

      const areaName = String(row[0] ?? "").trim();
      const subtheme = String(row[1] ?? "").trim();
      const agenda = String(row[2] ?? "").trim() || null;
      const dirNum = Number(row[3]) || null;
      const responsible = String(row[4] ?? "").trim();

      if (!areaName || !subtheme) {
        skipped++;
        continue;
      }

      const areaId = areaMap.get(areaName.toLowerCase());
      if (!areaId) {
        skipped++;
        continue;
      }

      const directionId = dirNum ? directionMap.get(dirNum) ?? null : null;
      const responsibleId = responsible
        ? userMap.get(responsible.toLowerCase()) ?? null
        : null;

      // Create item
      const item = await prisma.item.create({
        data: {
          subtheme,
          agenda,
          areaId,
          directionId,
          responsibleId,
          order: imported + 1,
        },
      });

      // Parse month columns (columns 5-16 = months 1-12)
      for (let m = 0; m < 12; m++) {
        const cellValue = row[5 + m];
        if (cellValue && String(cellValue).trim()) {
          await prisma.task.create({
            data: {
              name: String(cellValue).trim(),
              startMonth: m + 1,
              endMonth: m + 1,
              itemId: item.id,
            },
          });
        }
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: `Se importaron ${imported} iniciativas (${skipped} filas omitidas)`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Error procesando el archivo" },
      { status: 500 }
    );
  }
}
