"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday start
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function shiftISO(iso: string, days: number): string {
  return toISODate(addDays(parseISODate(iso), days));
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = weekStart.toLocaleDateString(undefined, opts);
  const end = weekEnd.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric" } : opts,
  );
  return `${start} – ${end}`;
}

export type WeekDayBarProps = {
  date: string;
  onChange: (iso: string) => void;
  markedDates?: Set<string> | string[];
  className?: string;
};

export function WeekDayBar({
  date,
  onChange,
  markedDates,
  className,
}: WeekDayBarProps) {
  const touchStartX = useRef<number | null>(null);
  const marked = useMemo(() => {
    if (!markedDates) return new Set<string>();
    return markedDates instanceof Set ? markedDates : new Set(markedDates);
  }, [markedDates]);

  const selected = parseISODate(date);
  const weekStart = startOfWeek(selected);
  const today = toISODate(new Date());

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        const iso = toISODate(d);
        return {
          iso,
          label: DAY_LABELS[d.getDay()],
          dayNum: d.getDate(),
          isToday: iso === today,
          isSelected: iso === date,
          hasEntries: marked.has(iso),
        };
      }),
    [weekStart, today, date, marked],
  );

  function onTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    e.stopPropagation();
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    // swipe left → next day; swipe right → previous day
    onChange(shiftISO(date, delta < 0 ? 1 : -1));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    touchStartX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (touchStartX.current == null) return;
    const delta = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    onChange(shiftISO(date, delta < 0 ? 1 : -1));
  }

  function shiftWeek(weeks: number) {
    onChange(shiftISO(date, weeks * 7));
  }

  return (
    <div
      className={cn(
        "select-none touch-pan-y rounded-[1.25rem] bg-[color:var(--surface)]/90 p-3 ring-1 ring-[color:var(--line)]/70",
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Previous week"
          className="touch-target"
          onClick={() => shiftWeek(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-xs font-semibold tabular-nums text-[color:var(--ink-soft)]">
          {formatWeekRange(weekStart)}
        </p>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Next week"
          className="touch-target"
          onClick={() => shiftWeek(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            key={day.iso}
            type="button"
            onClick={() => onChange(day.iso)}
            aria-pressed={day.isSelected}
            aria-label={`${day.label} ${day.dayNum}${day.isToday ? ", today" : ""}`}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors",
              day.isSelected
                ? "bg-[color:var(--brand)] text-white shadow-[0_10px_24px_-14px_rgba(15,157,138,0.9)]"
                : day.isToday
                  ? "bg-[color:var(--brand-soft)] text-[color:var(--brand-deep)]"
                  : "text-[color:var(--ink-soft)] active:bg-[color:var(--mist)]",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                day.isSelected ? "text-white/80" : "text-[color:var(--quiet)]",
              )}
            >
              {day.label}
            </span>
            <span className="font-[family-name:var(--font-display)] text-base font-semibold tabular-nums leading-none">
              {day.dayNum}
            </span>
            <span
              className={cn(
                "mt-0.5 size-1 rounded-full",
                day.hasEntries
                  ? day.isSelected
                    ? "bg-white"
                    : "bg-[color:var(--brand)]"
                  : "bg-transparent",
              )}
            />
          </button>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-[color:var(--quiet)]">
        Swipe to change day
      </p>
    </div>
  );
}

/** Also attach day swipe handlers to a larger diary surface */
export function useDaySwipe(
  date: string,
  onChange: (iso: string) => void,
  threshold = 56,
) {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.changedTouches[0]?.clientX ?? null;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const delta = endX - startX.current;
      startX.current = null;
      if (Math.abs(delta) < threshold) return;
      onChange(shiftISO(date, delta < 0 ? 1 : -1));
    },
  };
}
