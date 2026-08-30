"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, Star } from "lucide-react";
import type { FoodItem, FoodPortion, MealType } from "@/lib/types";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type SearchPayload = {
  foods: FoodItem[];
  source: "usda" | "mock";
  message?: string;
};

type BrowseTab = "search" | "recent" | "favorites";
type UnitMode = "grams" | "portion";

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

function resolveGrams(
  unitMode: UnitMode,
  grams: string,
  portions: FoodPortion[] | undefined,
  portionIndex: number,
  portionQty: string,
): number | null {
  if (unitMode === "grams") {
    const g = Number(grams);
    return Number.isFinite(g) && g > 0 ? g : null;
  }
  const portion = portions?.[portionIndex];
  const qty = Number(portionQty);
  if (!portion || !Number.isFinite(qty) || qty <= 0) return null;
  return portion.gramWeight * qty;
}

export function FoodSearch({
  mode = "log",
  onPick,
  initialMeal,
  initialDate,
}: {
  mode?: "log" | "pick";
  onPick?: (food: FoodItem) => void;
  /** Optional preselect from `?meal=` (compatible with diary meal-add links) */
  initialMeal?: string | null;
  /** Optional log date from `?date=` */
  initialDate?: string | null;
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
  const [unitMode, setUnitMode] = useState<UnitMode>("grams");
  const [portionIndex, setPortionIndex] = useState(0);
  const [portionQty, setPortionQty] = useState("1");
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
    if (tab !== "search") return;
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(
          `/api/foods/search?q=${encodeURIComponent(debounced)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const payload = (await res.json()) as SearchPayload;
        setResult(payload);
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

  function resetAmountState() {
    setGrams("100");
    setUnitMode("grams");
    setPortionIndex(0);
    setPortionQty("1");
  }

  async function openFood(food: FoodItem) {
    rememberFood(food);

    if (mode === "pick" && onPick) {
      onPick(food);
      return;
    }

    setDetailLoading(true);
    resetAmountState();
    setSelected(food);
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
        resetAmountState();
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
    const g = resolveGrams(
      unitMode,
      grams,
      selected.portions,
      portionIndex,
      portionQty,
    );
    if (g == null) return;
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

  const hasPortions = (selected?.portions?.length ?? 0) > 0;
  const effectiveGrams = selected
    ? resolveGrams(
        unitMode,
        grams,
        selected.portions,
        portionIndex,
        portionQty,
      )
    : null;
  const scaled =
    selected && effectiveGrams != null
      ? scaleNutrients(selected.nutrientsPer100g, effectiveGrams)
      : null;
  const perLabel =
    effectiveGrams != null
      ? unitMode === "portion" && selected?.portions?.[portionIndex]
        ? `${portionQty} × ${selected.portions[portionIndex].label} (${Math.round(effectiveGrams)}g)`
        : `${effectiveGrams}g`
      : "";

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
          if (
            value === "search" ||
            value === "recent" ||
            value === "favorites"
          ) {
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-[1.75rem] border-[color:var(--line)] bg-[color:var(--surface)] p-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_-28px_rgba(15,157,138,0.45)]"
        >
          <div
            className="mx-auto mt-3 h-1.5 w-11 shrink-0 rounded-full bg-[color:var(--brand-soft)]"
            aria-hidden
          />
          <SheetHeader className="px-5 pb-2 pt-3 text-left">
            <SheetTitle className="font-[family-name:var(--font-display)] text-xl font-semibold leading-snug text-[color:var(--ink)]">
              {selected?.description}
            </SheetTitle>
          </SheetHeader>
          {detailLoading || !selected ? (
            <div className="flex items-center gap-2 px-5 py-10 text-sm text-[color:var(--quiet)]">
              <Loader2 className="size-4 animate-spin" /> Loading nutrients…
            </div>
          ) : (
            <div className="space-y-5 px-5 pb-5 pt-1">
              {hasPortions && (
                <div
                  className="grid grid-cols-2 gap-1 rounded-2xl bg-[color:var(--mist)] p-1"
                  role="tablist"
                  aria-label="Amount unit"
                >
                  {(["grams", "portion"] as const).map((modeOption) => (
                    <button
                      key={modeOption}
                      type="button"
                      role="tab"
                      aria-selected={unitMode === modeOption}
                      onClick={() => setUnitMode(modeOption)}
                      className={cn(
                        "h-10 rounded-xl text-sm font-medium transition-colors",
                        unitMode === modeOption
                          ? "bg-[color:var(--brand)] text-white shadow-sm"
                          : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                      )}
                    >
                      {modeOption === "grams" ? "Grams" : "Portion"}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {unitMode === "grams" || !hasPortions ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="grams">Amount (g)</Label>
                    <Input
                      id="grams"
                      type="number"
                      min={1}
                      inputMode="decimal"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="portion-qty">Quantity</Label>
                    <Input
                      id="portion-qty"
                      type="number"
                      min={0.1}
                      step="0.1"
                      inputMode="decimal"
                      value={portionQty}
                      onChange={(e) => setPortionQty(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                )}
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

              {unitMode === "portion" && hasPortions && (
                <div className="space-y-1.5">
                  <Label>Portion</Label>
                  <Select
                    value={String(portionIndex)}
                    onValueChange={(v) => {
                      if (v != null) setPortionIndex(Number(v));
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Choose portion">
                        {selected.portions![portionIndex]
                          ? `${selected.portions![portionIndex].label} · ${Math.round(selected.portions![portionIndex].gramWeight)}g`
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selected.portions!.map((portion, idx) => (
                        <SelectItem
                          key={`${portion.label}-${portion.gramWeight}-${idx}`}
                          value={String(idx)}
                          label={`${portion.label} · ${Math.round(portion.gramWeight)}g`}
                        >
                          {portion.label} · {Math.round(portion.gramWeight)}g
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {effectiveGrams != null && (
                    <p className="text-xs text-[color:var(--quiet)]">
                      Equals {Math.round(effectiveGrams * 10) / 10}g
                    </p>
                  )}
                </div>
              )}

              {scaled && (
                <NutrientPanel nutrients={scaled} perLabel={perLabel} />
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
                  disabled={effectiveGrams == null}
                  className="h-12 flex-1 rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
                >
                  Add to diary
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
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
