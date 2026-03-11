"use client";

import { useTransition } from "react";
import Link from "next/link";
import { activatePlan, archivePlan, deleteDraftPlan } from "@/actions/plans";
import type { PlanSummary } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Activo", className: "bg-green-100 text-green-700" },
  ARCHIVED: { label: "Archivado", className: "bg-gray-100 text-gray-500" },
};

export function PlanManager({ plans }: { plans: PlanSummary[] }) {
  if (plans.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-foreground">Planes estratégicos</h3>
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanSummary }) {
  const [isPending, startTransition] = useTransition();
  const badge = STATUS_BADGE[plan.status] ?? STATUS_BADGE.DRAFT;

  function handleActivate() {
    if (!confirm(`¿Activar el plan "${plan.company} ${plan.year}"? El plan activo actual será archivado.`)) return;
    startTransition(async () => {
      await activatePlan(plan.id);
    });
  }

  function handleArchive() {
    if (!confirm(`¿Archivar el plan "${plan.company} ${plan.year}"?`)) return;
    startTransition(async () => {
      await archivePlan(plan.id);
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar el borrador "${plan.company} ${plan.year}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await deleteDraftPlan(plan.id);
    });
  }

  return (
    <div
      className={`rounded-lg border border-border p-4 transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {plan.company}
            </span>
            <span className="rounded bg-muted/20 px-1.5 py-0.5 text-xs font-medium text-foreground">
              {plan.year}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {plan._count.directions} direcciones · {plan._count.areas} áreas
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {plan.status === "DRAFT" && (
            <>
              <Link
                href={`/plan/nuevo?planId=${plan.id}`}
                className="rounded px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Editar
              </Link>
              <button
                onClick={handleActivate}
                disabled={isPending}
                className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                Activar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar
              </button>
            </>
          )}
          {plan.status === "ACTIVE" && (
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="rounded px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              Archivar
            </button>
          )}
          {plan.status === "ARCHIVED" && (
            <button
              onClick={handleActivate}
              disabled={isPending}
              className="rounded px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              Reactivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
