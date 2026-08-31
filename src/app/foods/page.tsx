import { FoodSearch } from "@/components/food-search";
import type { MealType } from "@/lib/types";
import { todayISO } from "@/lib/storage";

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function parseMeal(value: string | string[] | undefined): MealType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return MEALS.includes(raw as MealType) ? (raw as MealType) : null;
}

function parseDate(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return raw;
}

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string | string[]; date?: string | string[] }>;
}) {
  const params = await searchParams;
  const meal = parseMeal(params.meal);
  const date = parseDate(params.date);
  const today = todayISO();
  const loggingDate = date ?? today;

  const subtitle =
    meal && loggingDate !== today
      ? `Search Open Food Facts, then log to ${meal} on ${loggingDate}.`
      : meal
        ? `Search Open Food Facts, then log to ${meal}.`
        : "Search Open Food Facts for macros and micros, then log to today.";

  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Foods
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{subtitle}</p>
      </div>
      <FoodSearch mode="log" initialMeal={meal} initialDate={date} />
    </div>
  );
}
