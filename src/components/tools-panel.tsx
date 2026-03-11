"use client";

import { useState, useRef } from "react";

export function ToolsPanel({
  isAdmin,
  year,
}: {
  isAdmin: boolean;
  year: number;
}) {
  return (
    <div className="space-y-6">
      {/* Export section */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Exportar Plan
        </h3>
        <p className="mb-4 text-xs text-muted">
          Descargá el plan estratégico como archivo Excel.
        </p>
        <div className="flex gap-3">
          <a
            href="/api/export/excel"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M8 2v8m0 0L5 7m3 3l3-3M3 12h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exportar Excel
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M4 6V2h8v4M4 12H2V8h12v4h-2M4 10h8v4H4v-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Import section — admin only */}
      {isAdmin && <ImportCard />}
    </div>
  );
}

function ImportCard() {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Error al importar");
      } else {
        setStatus("success");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-foreground">
        Importar desde Excel
      </h3>
      <p className="mb-4 text-xs text-muted">
        Importá iniciativas y tareas desde un archivo Excel. El archivo debe
        tener las columnas: Área, Subtema, Agenda, Dir., Responsable, y las 12
        columnas de meses (Ene–Dic).
      </p>

      <form onSubmit={handleUpload} className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
        />
        <button
          type="submit"
          disabled={status === "uploading"}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === "uploading" ? "Importando…" : "Importar"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            status === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
