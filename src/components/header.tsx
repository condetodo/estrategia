"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const tabs = [
  { label: "Plan", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Mis Tareas", href: "/mis-tareas" },
  { label: "Herramientas", href: "/herramientas" },
];

export function Header({ company, year }: { company?: string; year?: number } = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="bg-primary text-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            {company ?? "Plan Estratégico Digital"}
          </h1>
          {year && (
            <span className="rounded bg-white/15 px-2 py-0.5 text-sm font-medium">
              {year}
            </span>
          )}
        </div>

        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {(session.user as any).initials ||
                  session.user.name?.charAt(0) ||
                  "?"}
              </div>
              <span className="hidden text-sm font-medium text-white/90 sm:inline">
                {session.user.name}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        )}
      </div>
      <nav className="flex gap-1 px-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-t px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
