"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, Star } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type SearchPayload = {
  foods: FoodItem[];
  source: "usda" | "mock";
  message?: string;
};

type BrowseTab = "search" | "recent" | "favorites";

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function FoodSearch({
  mode = "log",
  onPick,
}: {
  mode?: "log" | "pick";
  onPick?: (food: FoodItem) => void;
}) {
  const { data, logEntry, rememberFood, toggleFavorite } = useStore();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<BrowseTab>("search");
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
    if (tab !== "search") return;
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
  }, [debounced, tab]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim() && tab !== "search") setTab("search");
  }

  async function openFood(food: FoodItem) {
    rememberFood(food);

    if (mode === "pick" && onPick) {
      onPick(food);
      return;
    }

    setDetailLoading(true);
    setGrams("100");
    try {
      const res = await fetch(`/api/foods/${food.fdcId}`);
      if (res.ok) {
        const payload = (await res.json()) as {
          food: FoodItem;
          source?: "usda" | "mock";
        };
        const detailed = payload.food;
        // Sample FDC IDs can collide with unrelated USDA entries under DEMO_KEY.
        // Keep the food the user clicked when the detail payload doesn't match.
        const clickedLabel = food.description.split(",")[0]?.toLowerCase() ?? "";
        const detailMatches =
          detailed.fdcId === food.fdcId &&
          (payload.source === "mock" ||
            detailed.description.toLowerCase().includes(clickedLabel));
        const next = detailMatches ? detailed : food;
        setSelected(next);
        if (detailMatches) rememberFood(detailed);
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

  const favoriteIds = new Set(data.favoriteFoods.map((f) => f.fdcId));
  const selectedIsFavorite = selected
    ? favoriteIds.has(selected.fdcId)
    : false;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--quiet)]" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search foods…"
          className="h-12 rounded-2xl border-[color:var(--line)] bg-[color:var(--surface)] pl-11 text-base shadow-sm"
          aria-label="Search foods"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === "search" || value === "recent" || value === "favorites") {
            setTab(value);
          }
        }}
        className="gap-3"
      >
        <TabsList className="h-10 w-full rounded-2xl bg-[color:var(--mist)] p-1">
          <TabsTrigger
            value="search"
            className="h-full flex-1 rounded-xl data-active:bg-[color:var(--surface)] data-active:text-[color:var(--ink)] data-active:shadow-sm"
          >
            Search
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="h-full flex-1 rounded-xl data-active:bg-[color:var(--surface)] data-active:text-[color:var(--ink)] data-active:shadow-sm"
          >
            Recent
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="h-full flex-1 rounded-xl data-active:bg-[color:var(--surface)] data-active:text-[color:var(--ink)] data-active:shadow-sm"
          >
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-3">
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
          <FoodList
            foods={result?.foods ?? []}
            emptyLabel="No foods yet. Try another search."
            pending={pending}
            favoriteIds={favoriteIds}
            onOpen={openFood}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="recent" className="space-y-3">
          <p className="px-1 text-xs text-[color:var(--quiet)]">
            Foods you opened recently
          </p>
          <FoodList
            foods={data.recentFoods}
            emptyLabel="No recent searches yet. Open a food to save it here."
            favoriteIds={favoriteIds}
            onOpen={openFood}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="favorites" className="space-y-3">
          <p className="px-1 text-xs text-[color:var(--quiet)]">
            Star foods to keep them handy
          </p>
          <FoodList
            foods={data.favoriteFoods}
            emptyLabel="No favorites yet. Tap the star on any food."
            favoriteIds={favoriteIds}
            onOpen={openFood}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 font-[family-name:var(--font-display)] text-xl font-semibold leading-snug">
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selected && toggleFavorite(selected)}
                  className="h-12 shrink-0 rounded-full border-[color:var(--line)] px-4"
                  aria-label={
                    selectedIsFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  aria-pressed={selectedIsFavorite}
                >
                  <Star
                    className={cn(
                      "size-4",
                      selectedIsFavorite &&
                        "fill-[color:var(--brand)] text-[color:var(--brand)]",
                    )}
                  />
                  {selectedIsFavorite ? "Saved" : "Favorite"}
                </Button>
                <Button
                  onClick={confirmLog}
                  className="h-12 flex-1 rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
                >
                  Add to diary
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FoodList({
  foods,
  emptyLabel,
  pending = false,
  favoriteIds,
  onOpen,
  onToggleFavorite,
}: {
  foods: FoodItem[];
  emptyLabel: string;
  pending?: boolean;
  favoriteIds: Set<number>;
  onOpen: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
}) {
  if (foods.length === 0 && !pending) {
    return (
      <ul className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
        <li className="px-4 py-10 text-center text-sm text-[color:var(--quiet)]">
          {emptyLabel}
        </li>
      </ul>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
      {foods.map((food, idx) => {
        const isFavorite = favoriteIds.has(food.fdcId);
        return (
          <li
            key={food.fdcId}
            className={cn(
              "flex items-stretch",
              idx > 0 && "border-t border-[color:var(--line)]/70",
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(food)}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3.5 text-left transition-colors active:bg-[color:var(--mist)] hover:bg-[color:var(--mist)]"
            >
              <span className="text-sm font-medium leading-snug text-[color:var(--ink)]">
                {food.description}
              </span>
              <span className="text-xs text-[color:var(--quiet)]">
                {Math.round(food.nutrientsPer100g.calories)} kcal / 100g
                {food.dataType ? ` · ${food.dataType}` : ""}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(food)}
              className="inline-flex w-12 shrink-0 items-center justify-center text-[color:var(--quiet)] transition-colors hover:bg-[color:var(--mist)] hover:text-[color:var(--brand)]"
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              aria-pressed={isFavorite}
            >
              <Star
                className={cn(
                  "size-4",
                  isFavorite &&
                    "fill-[color:var(--brand)] text-[color:var(--brand)]",
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
