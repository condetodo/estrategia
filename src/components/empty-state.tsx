import Link from "next/link";
import type { PlanSummary } from "@/lib/types";

export function EmptyState({
  isAdmin,
  draftPlans = [],
}: {
  isAdmin: boolean;
  draftPlans?: PlanSummary[];
}) {
  const currentYear = new Date().getFullYear();

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
            <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No hay un plan activo
          </h2>
          <p className="text-sm text-muted">
            Contactá al administrador para activar un plan estratégico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold text-foreground">
          Crear plan estratégico
        </h2>
        <p className="mb-8 text-sm text-muted">
          Armá el plan del {currentYear} paso a paso: definí las direcciones
          estratégicas y las áreas de trabajo.
        </p>

        {/* Primary CTA */}
        <Link
          href="/plan/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-light"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear Plan {currentYear}
        </Link>

        {/* Secondary: import */}
        <p className="mt-4 text-xs text-muted">
          ¿Ya tenés un Excel?{" "}
          <Link href="/herramientas" className="font-medium text-primary hover:underline">
            Importar desde archivo
          </Link>
        </p>

        {/* Draft plans */}
        {draftPlans.length > 0 && (
          <div className="mt-8 rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Borradores pendientes
            </h3>
            <div className="space-y-2">
              {draftPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plan/nuevo?planId=${plan.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-background"
                >
                  <span className="font-medium text-foreground">
                    {plan.company} — {plan.year}
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Borrador
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
