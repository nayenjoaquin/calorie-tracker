"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartLine, Leaf, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Diary", icon: UtensilsCrossed },
  { href: "/foods", label: "Foods", icon: Leaf },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: ChartLine },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-full flex flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(61,122,74,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute top-1/3 -left-28 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(214,122,58,0.14),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(46,90,68,0.12),transparent_70%)] blur-xl" />
      </div>

      <header className="relative z-10 border-b border-[color:var(--line)]/70 bg-[color:var(--surface)]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[color:var(--ink)] sm:text-3xl">
              Platewise
            </span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-[color:var(--quiet)] sm:inline">
              daily fuel
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
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[color:var(--forest)] text-white"
                      : "text-[color:var(--ink-soft)] hover:bg-[color:var(--mist)] hover:text-[color:var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <nav className="sticky bottom-0 z-20 border-t border-[color:var(--line)]/80 bg-[color:var(--surface)]/95 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
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
                  "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors",
                  active
                    ? "text-[color:var(--forest)]"
                    : "text-[color:var(--quiet)]",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
