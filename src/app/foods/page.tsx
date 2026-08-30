import { FoodSearch } from "@/components/food-search";

export default function FoodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--quiet)]">
          USDA FoodData Central
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[color:var(--ink)] sm:text-5xl">
          Foods
        </h1>
        <p className="mt-2 max-w-lg text-sm text-[color:var(--ink-soft)]">
          Search foundation and legacy foods for macros and micronutrients, then
          add them to today&apos;s diary.
        </p>
      </div>
      <FoodSearch mode="log" />
    </div>
  );
}
