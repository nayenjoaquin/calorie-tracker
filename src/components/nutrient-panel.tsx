import type { Nutrients } from "@/lib/types";
import {
  formatNutrient,
  MACRO_KEYS,
  MICRO_KEYS,
  NUTRIENT_META,
  type NutrientKey,
} from "@/lib/nutrients";
import { cn } from "@/lib/utils";

export function CalorieHero({
  calories,
  goal,
  className,
}: {
  calories: number;
  goal: number;
  className?: string;
}) {
  const pct = goal > 0 ? Math.min(1, calories / goal) : 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const remaining = Math.max(0, Math.round(goal - calories));

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative size-[7.5rem] shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--mist)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums leading-none text-[color:var(--ink)]">
              {Math.round(calories)}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--quiet)]">
              kcal
            </p>
          </div>
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--quiet)]">
          Today
        </p>
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--ink)]">
          {remaining === 0 && calories >= goal
            ? "Goal reached"
            : `${remaining} left`}
        </p>
        <p className="text-sm text-[color:var(--ink-soft)]">
          of {goal} kcal goal · {Math.round(pct * 100)}%
        </p>
      </div>
    </div>
  );
}

export function MacroStrip({
  nutrients,
  goals,
  className,
  hideCalories = false,
}: {
  nutrients: Nutrients;
  goals?: { calories: number; protein: number; carbs: number; fat: number };
  className?: string;
  hideCalories?: boolean;
}) {
  const items: { key: NutrientKey; goal?: number }[] = [
    ...(hideCalories
      ? []
      : [{ key: "calories" as const, goal: goals?.calories }]),
    { key: "protein", goal: goals?.protein },
    { key: "carbs", goal: goals?.carbs },
    { key: "fat", goal: goals?.fat },
  ];

  return (
    <div
      className={cn(
        "grid gap-3",
        hideCalories ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map(({ key, goal }) => {
        const meta = NUTRIENT_META[key];
        const value = nutrients[key];
        const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--quiet)]">
                {meta.short}
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums text-[color:var(--ink)]">
                {key === "calories"
                  ? Math.round(value)
                  : value.toFixed(value >= 10 ? 0 : 1)}
              </span>
            </div>
            {goal != null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--mist)]">
                <div
                  className="h-full rounded-full bg-[color:var(--brand)] transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function NutrientPanel({
  nutrients,
  perLabel = "totals",
  compact = false,
}: {
  nutrients: Nutrients;
  perLabel?: string;
  compact?: boolean;
}) {
  const macros = MACRO_KEYS;
  const micros = MICRO_KEYS.filter((k) => nutrients[k] > 0);

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--quiet)]">
        Nutrients · {perLabel}
      </p>
      <div
        className={cn(
          "grid gap-1",
          compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {macros.map((key) => (
          <NutrientRow key={key} nutrientKey={key} value={nutrients[key]} />
        ))}
      </div>
      {micros.length > 0 && (
        <>
          <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--quiet)]">
            Micronutrients
          </p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {micros.map((key) => (
              <NutrientRow key={key} nutrientKey={key} value={nutrients[key]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NutrientRow({
  nutrientKey,
  value,
}: {
  nutrientKey: NutrientKey;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--line)]/70 py-2 text-sm last:border-0">
      <span className="text-[color:var(--ink-soft)]">
        {NUTRIENT_META[nutrientKey].label}
      </span>
      <span className="tabular-nums font-medium text-[color:var(--ink)]">
        {formatNutrient(nutrientKey, value)}
      </span>
    </div>
  );
}
