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
import { cn } from "@/lib/utils";

type SearchPayload = {
  foods: FoodItem[];
  source: "usda" | "mock";
  message?: string;
};

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function isMealType(value: string | undefined | null): value is MealType {
  return (
    value === "breakfast" ||
    value === "lunch" ||
    value === "dinner" ||
    value === "snack"
  );
}

function isISODate(value: string | undefined | null): value is string {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime());
}

export function FoodSearch({
  mode = "log",
  onPick,
  initialMeal,
  initialDate,
}: {
  mode?: "log" | "pick";
  onPick?: (food: FoodItem) => void;
  initialMeal?: string | null;
  initialDate?: string | null;
}) {
  const { logEntry } = useStore();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState("100");
  const [meal, setMeal] = useState<MealType>(
    isMealType(initialMeal) ? initialMeal : "lunch",
  );
  const logDate = isISODate(initialDate) ? initialDate : todayISO();
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (isMealType(initialMeal)) setMeal(initialMeal);
  }, [initialMeal]);

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
      date: logDate,
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
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--quiet)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="h-12 rounded-2xl border-[color:var(--line)] bg-[color:var(--surface)] pl-11 text-base shadow-sm"
          aria-label="Search foods"
        />
      </div>

      <div className="flex min-h-5 items-center gap-2 px-1 text-xs text-[color:var(--quiet)]">
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

      <ul className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
        {(result?.foods ?? []).length === 0 && !pending ? (
          <li className="px-4 py-10 text-center text-sm text-[color:var(--quiet)]">
            No foods yet. Try another search.
          </li>
        ) : (
          (result?.foods ?? []).map((food, idx) => (
            <li
              key={food.fdcId}
              className={cn(
                idx > 0 && "border-t border-[color:var(--line)]/70",
              )}
            >
              <button
                type="button"
                onClick={() => openFood(food)}
                className="flex w-full flex-col gap-0.5 px-4 py-3.5 text-left transition-colors active:bg-[color:var(--mist)] hover:bg-[color:var(--mist)]"
              >
                <span className="text-sm font-medium leading-snug text-[color:var(--ink)]">
                  {food.description}
                </span>
                <span className="text-xs text-[color:var(--quiet)]">
                  {Math.round(food.nutrientsPer100g.calories)} kcal / 100g
                  {food.dataType ? ` · ${food.dataType}` : ""}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl font-semibold leading-snug">
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
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Meal</Label>
                  <Select
                    value={meal}
                    onValueChange={(v) => {
                      if (v) setMeal(v as MealType);
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
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
                className="h-12 w-full rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
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
