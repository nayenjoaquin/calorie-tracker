import { FoodSearch } from "@/components/food-search";

export default function FoodsPage() {
  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Foods
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          Search USDA for macros and micros, then log to today.
        </p>
      </div>
      <FoodSearch mode="log" />
    </div>
  );
}
