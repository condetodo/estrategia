const STEPS = [
  { number: 1, label: "Datos" },
  { number: 2, label: "Direcciones" },
  { number: 3, label: "Áreas" },
  { number: 4, label: "Activar" },
];

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center gap-1 sm:gap-2">
            {/* Step circle */}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-2"
                      : "bg-muted/30 text-muted"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isCurrent ? "text-foreground" : isCompleted ? "text-primary" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
