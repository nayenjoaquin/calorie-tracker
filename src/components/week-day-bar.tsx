"use client";

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type SlideDir = "left" | "right" | "none";

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
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function shiftISO(iso: string, days: number): string {
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

function dirForDelta(delta: number): SlideDir {
  return delta < 0 ? "left" : "right";
}

export type WeekDayBarProps = {
  date: string;
  onChange: (iso: string, dir?: SlideDir) => void;
  markedDates?: Set<string> | string[];
  className?: string;
  dragX?: number;
  onDragX?: (x: number) => void;
};

export function WeekDayBar({
  date,
  onChange,
  markedDates,
  className,
  dragX = 0,
  onDragX,
}: WeekDayBarProps) {
  const touchStartX = useRef<number | null>(null);
  const dragging = useRef(false);
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

  function begin(x: number) {
    touchStartX.current = x;
    dragging.current = true;
  }

  function move(x: number) {
    if (!dragging.current || touchStartX.current == null) return;
    onDragX?.(x - touchStartX.current);
  }

  function end(x: number) {
    if (!dragging.current || touchStartX.current == null) {
      dragging.current = false;
      touchStartX.current = null;
      onDragX?.(0);
      return;
    }
    const delta = x - touchStartX.current;
    touchStartX.current = null;
    dragging.current = false;
    if (Math.abs(delta) < 40) {
      onDragX?.(0);
      return;
    }
    onChange(shiftISO(date, delta < 0 ? 1 : -1), dirForDelta(delta));
  }

  function shiftWeek(weeks: number) {
    onChange(shiftISO(date, weeks * 7), weeks > 0 ? "left" : "right");
  }

  return (
    <div
      className={cn(
        "select-none touch-pan-y rounded-[1.25rem] bg-[color:var(--surface)]/90 p-3 ring-1 ring-[color:var(--line)]/70",
        className,
      )}
      onTouchStart={(e) => {
        e.stopPropagation();
        begin(e.changedTouches[0]?.clientX ?? 0);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        move(e.changedTouches[0]?.clientX ?? 0);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        end(e.changedTouches[0]?.clientX ?? 0);
      }}
      onTouchCancel={() => {
        dragging.current = false;
        touchStartX.current = null;
        onDragX?.(0);
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") return;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        begin(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        move(e.clientX);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") return;
        end(e.clientX);
      }}
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

      <div
        className="grid grid-cols-7 gap-1 will-change-transform"
        style={{
          transform: `translateX(${Math.max(-36, Math.min(36, dragX * 0.18))}px)`,
          transition:
            Math.abs(dragX) > 2
              ? "none"
              : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {days.map((day) => (
          <button
            key={day.iso}
            type="button"
            onClick={() =>
              onChange(
                day.iso,
                day.iso === date ? "none" : day.iso > date ? "left" : "right",
              )
            }
            aria-pressed={day.isSelected}
            aria-label={`${day.label} ${day.dayNum}${day.isToday ? ", today" : ""}`}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-[background-color,color,transform,box-shadow] duration-300 ease-out",
              day.isSelected
                ? "scale-[1.06] bg-[color:var(--brand)] text-white shadow-[0_10px_24px_-14px_rgba(15,157,138,0.9)]"
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
                "mt-0.5 size-1 rounded-full transition-colors",
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

export function useDaySwipe(
  date: string,
  onChange: (iso: string, dir?: SlideDir) => void,
  onDragX?: (x: number) => void,
  threshold = 48,
) {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.changedTouches[0]?.clientX ?? null;
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (startX.current == null) return;
      const x = e.changedTouches[0]?.clientX ?? startX.current;
      onDragX?.(x - startX.current);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const delta = endX - startX.current;
      startX.current = null;
      if (Math.abs(delta) < threshold) {
        onDragX?.(0);
        return;
      }
      onChange(shiftISO(date, delta < 0 ? 1 : -1), dirForDelta(delta));
    },
    onTouchCancel: () => {
      startX.current = null;
      onDragX?.(0);
    },
  };
}

export function DaySlide({
  animKey,
  dir,
  dragX,
  children,
  className,
}: {
  animKey: string;
  dir: SlideDir;
  dragX: number;
  children: ReactNode;
  className?: string;
}) {
  const dragging = Math.abs(dragX) > 2;

  return (
    <div className="relative overflow-hidden">
      {/* Peek of the outgoing direction while dragging */}
      {dragging && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-10 rounded-2xl bg-[color:var(--brand)]/10"
          style={{
            [dragX < 0 ? "right" : "left"]: 0,
            opacity: Math.min(0.9, Math.abs(dragX) / 160),
          }}
        />
      )}
      <div
        key={animKey}
        className={cn(
          className,
          "will-change-transform",
          !dragging && dir === "left" && "animate-day-from-right",
          !dragging && dir === "right" && "animate-day-from-left",
          !dragging && dir === "none" && "animate-day-fade",
        )}
        style={
          dragging
            ? {
                transform: `translateX(${dragX}px)`,
                opacity: Math.max(0.45, 1 - Math.abs(dragX) / 380),
                transition: "none",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

export function useAnimatedDate(initial: string) {
  const [date, setDateState] = useState(initial);
  const [dir, setDir] = useState<SlideDir>("none");
  const [dragX, setDragX] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const setDate = useCallback((next: string, slide: SlideDir = "none") => {
    setDateState((prev) => {
      if (next === prev) {
        setDragX(0);
        return prev;
      }
      const resolved: SlideDir =
        slide === "none" ? (next > prev ? "left" : "right") : slide;
      // Schedule related state outside the updater for React correctness
      queueMicrotask(() => {
        setDir(resolved);
        setDragX(0);
        setAnimKey((k) => k + 1);
      });
      return next;
    });
  }, []);

  return { date, setDate, dir, dragX, setDragX, animKey };
}
