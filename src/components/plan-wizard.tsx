"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WizardStepper } from "@/components/wizard-stepper";
import { createPlan, setDirections, setAreas, activatePlan } from "@/actions/plans";
import { AREA_COLORS } from "@/lib/types";
import type { WizardPlanData } from "@/lib/types";

type DirectionDraft = { number: number; description: string };
type AreaDraft = { name: string; color: string; order: number };

function inferStep(data: WizardPlanData | null): number {
  if (!data) return 1;
  if (data.directions.length === 0) return 2;
  if (data.areas.length === 0) return 3;
  return 4;
}

export function PlanWizard({ initialData }: { initialData: WizardPlanData | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(inferStep(initialData));
  const [planId, setPlanId] = useState(initialData?.id ?? null);

  // Step 1 state
  const [year, setYear] = useState(initialData?.year ?? new Date().getFullYear());
  const [company, setCompany] = useState(initialData?.company ?? "");

  // Step 2 state
  const [directions, setDirectionsState] = useState<DirectionDraft[]>(
    initialData?.directions.map((d) => ({ number: d.number, description: d.description })) ?? []
  );

  // Step 3 state
  const [areas, setAreasState] = useState<AreaDraft[]>(
    initialData?.areas.map((a) => ({ name: a.name, color: a.color, order: a.order })) ?? []
  );

  const [error, setError] = useState<string | null>(null);

  // ---- Step 1: Plan basics ----
  function handleStep1() {
    if (!company.trim()) {
      setError("Ingresá el nombre de la empresa");
      return;
    }
    if (year < 2020 || year > 2100) {
      setError("El año debe estar entre 2020 y 2100");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (!planId) {
          const id = await createPlan({ year, company: company.trim() });
          setPlanId(id);
        }
        setStep(2);
      } catch (e: any) {
        setError(e.message || "Error al crear el plan");
      }
    });
  }

  // ---- Step 2: Directions ----
  function addDirection() {
    setDirectionsState((prev) => [
      ...prev,
      { number: prev.length + 1, description: "" },
    ]);
  }

  function removeDirection(index: number) {
    setDirectionsState((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((d, i) => ({ ...d, number: i + 1 }));
    });
  }

  function updateDirection(index: number, description: string) {
    setDirectionsState((prev) =>
      prev.map((d, i) => (i === index ? { ...d, description } : d))
    );
  }

  function handleStep2() {
    const valid = directions.filter((d) => d.description.trim());
    if (valid.length === 0) {
      setError("Agregá al menos una dirección estratégica");
      return;
    }
    setError(null);
    const numbered = valid.map((d, i) => ({ number: i + 1, description: d.description.trim() }));
    startTransition(async () => {
      try {
        await setDirections(planId!, numbered);
        setDirectionsState(numbered);
        setStep(3);
      } catch (e: any) {
        setError(e.message || "Error al guardar direcciones");
      }
    });
  }

  // ---- Step 3: Areas ----
  function addArea() {
    const usedColors = new Set(areas.map((a) => a.color));
    const nextColor = AREA_COLORS.find((c) => !usedColors.has(c.value))?.value ?? AREA_COLORS[0].value;
    setAreasState((prev) => [
      ...prev,
      { name: "", color: nextColor, order: prev.length + 1 },
    ]);
  }

  function removeArea(index: number) {
    setAreasState((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((a, i) => ({ ...a, order: i + 1 }));
    });
  }

  function updateAreaName(index: number, name: string) {
    setAreasState((prev) =>
      prev.map((a, i) => (i === index ? { ...a, name } : a))
    );
  }

  function updateAreaColor(index: number, color: string) {
    setAreasState((prev) =>
      prev.map((a, i) => (i === index ? { ...a, color } : a))
    );
  }

  function handleStep3() {
    const valid = areas.filter((a) => a.name.trim());
    if (valid.length === 0) {
      setError("Agregá al menos un área");
      return;
    }
    setError(null);
    const ordered = valid.map((a, i) => ({ name: a.name.trim(), color: a.color, order: i + 1 }));
    startTransition(async () => {
      try {
        await setAreas(planId!, ordered);
        setAreasState(ordered);
        setStep(4);
      } catch (e: any) {
        setError(e.message || "Error al guardar áreas");
      }
    });
  }

  // ---- Step 4: Review & Activate ----
  function handleActivate() {
    setError(null);
    startTransition(async () => {
      try {
        await activatePlan(planId!);
        // activatePlan redirects via server action
      } catch (e: any) {
        setError(e.message || "Error al activar el plan");
      }
    });
  }

  function handleSaveDraft() {
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Stepper */}
      <div className="mb-8">
        <WizardStepper currentStep={step} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        {step === 1 && (
          <Step1
            year={year}
            company={company}
            onYearChange={setYear}
            onCompanyChange={setCompany}
            onNext={handleStep1}
            isPending={isPending}
          />
        )}

        {step === 2 && (
          <Step2
            directions={directions}
            onAdd={addDirection}
            onRemove={removeDirection}
            onUpdate={updateDirection}
            onNext={handleStep2}
            onBack={() => setStep(1)}
            isPending={isPending}
          />
        )}

        {step === 3 && (
          <Step3
            areas={areas}
            onAdd={addArea}
            onRemove={removeArea}
            onUpdateName={updateAreaName}
            onUpdateColor={updateAreaColor}
            onNext={handleStep3}
            onBack={() => setStep(2)}
            isPending={isPending}
          />
        )}

        {step === 4 && (
          <Step4
            year={year}
            company={company}
            directions={directions}
            areas={areas}
            onActivate={handleActivate}
            onSaveDraft={handleSaveDraft}
            onBack={() => setStep(3)}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}

// ========== Sub-components ==========

function Step1({
  year, company, onYearChange, onCompanyChange, onNext, isPending,
}: {
  year: number;
  company: string;
  onYearChange: (y: number) => void;
  onCompanyChange: (c: string) => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-foreground">Datos del plan</h2>
      <p className="mb-6 text-sm text-muted">Definí el año y la empresa del plan estratégico.</p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Empresa</label>
          <input
            type="text"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Ej: Agro Patagónico S.A."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Año</label>
          <input
            type="number"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            min={2020}
            max={2100}
            className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {isPending ? "Creando..." : "Siguiente"}
        </button>
      </div>
    </>
  );
}

function Step2({
  directions, onAdd, onRemove, onUpdate, onNext, onBack, isPending,
}: {
  directions: DirectionDraft[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, desc: string) => void;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-foreground">Direcciones estratégicas</h2>
      <p className="mb-6 text-sm text-muted">
        Definí los ejes estratégicos que guían el plan. Podés agregar las que necesites.
      </p>

      <div className="space-y-3">
        {directions.map((dir, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {dir.number}
            </span>
            <textarea
              value={dir.description}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="Descripción de la dirección estratégica..."
              rows={2}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => onRemove(i)}
              className="mt-2 rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
              title="Eliminar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agregar dirección
      </button>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Siguiente"}
        </button>
      </div>
    </>
  );
}

function Step3({
  areas, onAdd, onRemove, onUpdateName, onUpdateColor, onNext, onBack, isPending,
}: {
  areas: AreaDraft[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdateName: (i: number, name: string) => void;
  onUpdateColor: (i: number, color: string) => void;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-foreground">Áreas de trabajo</h2>
      <p className="mb-6 text-sm text-muted">
        Definí las áreas o departamentos del plan. Cada una tendrá sus propias iniciativas.
      </p>

      <div className="space-y-3">
        {areas.map((area, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
            {/* Color selector */}
            <div className="flex shrink-0 flex-wrap gap-1">
              {AREA_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onUpdateColor(i, c.value)}
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    area.color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:border-muted"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>

            {/* Name input */}
            <input
              type="text"
              value={area.name}
              onChange={(e) => onUpdateName(i, e.target.value)}
              placeholder="Nombre del área..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Delete */}
            <button
              onClick={() => onRemove(i)}
              className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
              title="Eliminar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agregar área
      </button>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Siguiente"}
        </button>
      </div>
    </>
  );
}

function Step4({
  year, company, directions, areas, onActivate, onSaveDraft, onBack, isPending,
}: {
  year: number;
  company: string;
  directions: DirectionDraft[];
  areas: AreaDraft[];
  onActivate: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-foreground">Revisión</h2>
      <p className="mb-6 text-sm text-muted">
        Revisá los datos antes de activar el plan. Después podrás agregar iniciativas y tareas.
      </p>

      {/* Plan info */}
      <div className="mb-6 rounded-lg bg-background p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Plan</div>
        <div className="text-lg font-bold text-foreground">{company}</div>
        <div className="text-sm text-muted">{year}</div>
      </div>

      {/* Directions */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Direcciones estratégicas ({directions.length})
        </div>
        <div className="space-y-2">
          {directions.map((d) => (
            <div key={d.number} className="flex items-start gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {d.number}
              </span>
              <span className="text-foreground/80">{d.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Areas */}
      <div className="mb-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Áreas ({areas.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {areas.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
              {a.name}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Atrás
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSaveDraft}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Guardar borrador
          </button>
          <button
            onClick={onActivate}
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            {isPending ? "Activando..." : "Activar plan"}
          </button>
        </div>
      </div>
    </>
  );
}
