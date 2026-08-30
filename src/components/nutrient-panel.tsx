import type { Nutrients } from "@/lib/types";
import {
  formatNutrient,
  MACRO_KEYS,
  MICRO_KEYS,
  NUTRIENT_META,
  type NutrientKey,
} from "@/lib/nutrients";
import { cn } from "@/lib/utils";

export function MacroStrip({
  nutrients,
  goals,
  className,
}: {
  nutrients: Nutrients;
  goals?: { calories: number; protein: number; carbs: number; fat: number };
  className?: string;
}) {
  const items: { key: NutrientKey; goal?: number }[] = [
    { key: "calories", goal: goals?.calories },
    { key: "protein", goal: goals?.protein },
    { key: "carbs", goal: goals?.carbs },
    { key: "fat", goal: goals?.fat },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {items.map(({ key, goal }) => {
        const meta = NUTRIENT_META[key];
        const value = nutrients[key];
        const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-[color:var(--quiet)]">
                {meta.short}
              </span>
              <span className="font-[family-name:var(--font-display)] text-xl text-[color:var(--ink)]">
                {key === "calories" ? Math.round(value) : value.toFixed(value >= 10 ? 0 : 1)}
                <span className="ml-1 text-xs font-sans text-[color:var(--quiet)]">
                  {meta.unit}
                </span>
              </span>
            </div>
            {goal != null && (
              <>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--mist)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--forest)] transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-[color:var(--quiet)]">
                  {pct}% of {goal} {meta.unit}
                </p>
              </>
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
      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--quiet)]">
        Nutrients · {perLabel}
      </p>
      <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")}>
        {macros.map((key) => (
          <NutrientRow key={key} nutrientKey={key} value={nutrients[key]} />
        ))}
      </div>
      {micros.length > 0 && (
        <>
          <p className="pt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--quiet)]">
            Micronutrients
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
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
    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--line)]/60 py-1.5 text-sm">
      <span className="text-[color:var(--ink-soft)]">
        {NUTRIENT_META[nutrientKey].label}
      </span>
      <span className="tabular-nums text-[color:var(--ink)]">
        {formatNutrient(nutrientKey, value)}
      </span>
    </div>
  );
}
