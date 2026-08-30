"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartLine,
  Leaf,
  Settings2,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Diary", icon: UtensilsCrossed },
  { href: "/foods", label: "Foods", icon: Leaf },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: ChartLine },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="bg-orb absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,157,138,0.22),transparent_70%)] blur-2xl" />
        <div className="absolute top-40 -right-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(94,200,255,0.2),transparent_70%)] blur-2xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[color:var(--line)]/60 bg-[color:var(--surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 md:max-w-3xl md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[color:var(--brand)] text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(15,157,138,0.8)]">
              P
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[color:var(--ink)]">
              Platewise
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[color:var(--brand)] text-white"
                      : "text-[color:var(--ink-soft)] hover:bg-[color:var(--mist)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="page-pad relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pt-5 md:max-w-3xl md:px-6 md:pt-8">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)]/80 bg-[color:var(--surface)]/92 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors",
                  active
                    ? "text-[color:var(--brand)]"
                    : "text-[color:var(--quiet)]",
                )}
              >
                {active && (
                  <span className="absolute top-1.5 h-1 w-1 rounded-full bg-[color:var(--brand)]" />
                )}
                <Icon className="size-5" strokeWidth={active ? 2.5 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
