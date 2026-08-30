"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import type { FoodItem, MealType } from "@/lib/types";
import { scaleNutrients } from "@/lib/nutrients";
import { newId, todayISO } from "@/lib/storage";
import { useStore } from "@/components/store-provider";
import { NutrientPanel } from "@/components/nutrient-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SearchPayload = {
  foods: FoodItem[];
  source: "usda" | "mock";
  message?: string;
};

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function FoodSearch({
  mode = "log",
  onPick,
}: {
  mode?: "log" | "pick";
  onPick?: (food: FoodItem) => void;
}) {
  const { logEntry } = useStore();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState("100");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(
          `/api/foods/search?q=${encodeURIComponent(debounced)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as SearchPayload;
        setResult(data);
      } catch {
        setError("Could not search foods. Try again.");
        setResult(null);
      }
    });
  }, [debounced]);

  async function openFood(food: FoodItem) {
    if (mode === "pick" && onPick) {
      onPick(food);
      return;
    }

    setDetailLoading(true);
    setGrams("100");
    try {
      const res = await fetch(`/api/foods/${food.fdcId}`);
      if (res.ok) {
        const data = (await res.json()) as { food: FoodItem };
        setSelected(data.food);
      } else {
        setSelected(food);
      }
    } catch {
      setSelected(food);
    } finally {
      setDetailLoading(false);
    }
  }

  function confirmLog() {
    if (!selected) return;
    const g = Number(grams);
    if (!Number.isFinite(g) || g <= 0) return;
    logEntry({
      id: newId(),
      date: todayISO(),
      meal,
      name: selected.description,
      source: "food",
      fdcId: selected.fdcId,
      grams: g,
      nutrients: scaleNutrients(selected.nutrientsPer100g, g),
    });
    setSelected(null);
  }

  const scaled =
    selected && Number(grams) > 0
      ? scaleNutrients(selected.nutrientsPer100g, Number(grams))
      : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--quiet)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search USDA foods — chicken, oats, banana…"
          className="h-11 border-[color:var(--line)] bg-[color:var(--surface)] pl-10"
          aria-label="Search foods"
        />
      </div>

      <div className="flex min-h-5 items-center gap-2 text-xs text-[color:var(--quiet)]">
        {pending && (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Searching…
          </>
        )}
        {!pending && result?.source === "usda" && (
          <span>Live USDA FoodData Central</span>
        )}
        {!pending && result?.source === "mock" && result.message && (
          <span>{result.message}</span>
        )}
        {error && <span className="text-destructive">{error}</span>}
      </div>

      <ul className="divide-y divide-[color:var(--line)]/70 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]">
        {(result?.foods ?? []).length === 0 && !pending ? (
          <li className="px-4 py-8 text-center text-sm text-[color:var(--quiet)]">
            No foods yet. Try another search.
          </li>
        ) : (
          (result?.foods ?? []).map((food) => (
            <li key={food.fdcId}>
              <button
                type="button"
                onClick={() => openFood(food)}
                className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-[color:var(--mist)]"
              >
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  {food.description}
                </span>
                <span className="text-xs text-[color:var(--quiet)]">
                  {food.dataType}
                  {food.brandOwner ? ` · ${food.brandOwner}` : ""}
                  {" · "}
                  {Math.round(food.nutrientsPer100g.calories)} kcal / 100g
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl leading-snug">
              {selected?.description}
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !selected ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[color:var(--quiet)]">
              <Loader2 className="size-4 animate-spin" /> Loading nutrients…
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="grams">Amount (g)</Label>
                  <Input
                    id="grams"
                    type="number"
                    min={1}
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Meal</Label>
                  <Select
                    value={meal}
                    onValueChange={(v) => setMeal(v as MealType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEALS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {scaled && (
                <NutrientPanel nutrients={scaled} perLabel={`${grams}g`} />
              )}
              <Button
                onClick={confirmLog}
                className="w-full bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
              >
                Add to diary
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
