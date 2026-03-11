"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Plan", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Header({ company, year }: { company: string; year: number }) {
  const pathname = usePathname();

  return (
    <header className="bg-primary text-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">{company}</h1>
          <span className="rounded bg-white/15 px-2 py-0.5 text-sm font-medium">
            {year}
          </span>
        </div>
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
