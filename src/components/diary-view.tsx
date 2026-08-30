"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, MoreVertical, Plus, Settings2, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import {
  CalorieHero,
  MacroStrip,
  NutrientPanel,
} from "@/components/nutrient-panel";
import { WeekDayBar, useDaySwipe, useAnimatedDate, DaySlide } from "@/components/week-day-bar";
import {
  mealEntriesToIngredients,
  multiplyNutrients,
  recipeNutrientsPerServing,
} from "@/lib/recipes";
import { addNutrients } from "@/lib/nutrients";
import { newId, todayISO } from "@/lib/storage";
import type { MealType, Recipe } from "@/lib/types";
import { EMPTY_NUTRIENTS } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function mealTitle(meal: MealType): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

export function DiaryView() {
  const { data, ready, removeEntry, logEntry, saveRecipe } = useStore();
  const { date, setDate, dir, dragX, setDragX, animKey } =
    useAnimatedDate(todayISO());
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [saveMeal, setSaveMeal] = useState<MealType | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveServings, setSaveServings] = useState("1");
  const daySwipe = useDaySwipe(date, setDate, setDragX);

  const markedDates = useMemo(
    () => new Set(data.diary.map((e) => e.date)),
    [data.diary],
  );

  const dayEntries = useMemo(
    () => data.diary.filter((e) => e.date === date),
    [data.diary, date],
  );

  const totals = useMemo(
    () =>
      dayEntries.length
        ? addNutrients(...dayEntries.map((e) => e.nutrients))
        : { ...EMPTY_NUTRIENTS },
    [dayEntries],
  );

  const byMeal = useMemo(() => {
    const map: Record<MealType, typeof dayEntries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of dayEntries) map[e.meal].push(e);
    return map;
  }, [dayEntries]);

  const dayHeading = useMemo(() => {
    const today = todayISO();
    if (date === today) return "Today";
    const d = new Date(`${date}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [date]);

  const knownFoods = useMemo(() => {
    const fromRecipes = data.recipes.flatMap((r) =>
      r.ingredients.map((i) => i.food),
    );
    return [...data.recentFoods, ...data.favoriteFoods, ...fromRecipes];
  }, [data.recentFoods, data.favoriteFoods, data.recipes]);

  function logRecipe() {
    const recipe = data.recipes.find((r) => r.id === selectedRecipe);
    if (!recipe) return;
    const s = Number(servings);
    if (!Number.isFinite(s) || s <= 0) return;

    const perServing = recipeNutrientsPerServing(recipe);
    const totalGrams = recipe.ingredients.reduce((a, i) => a + i.grams, 0);
    logEntry({
      id: newId(),
      date,
      meal,
      name: `${recipe.name} (${s} serving${s === 1 ? "" : "s"})`,
      source: "recipe",
      recipeId: recipe.id,
      grams: Math.round((totalGrams / (recipe.servings || 1)) * s),
      nutrients: multiplyNutrients(perServing, s),
    });
    setRecipeOpen(false);
  }

  function openSaveMeal(m: MealType) {
    const entries = byMeal[m];
    if (entries.length === 0) return;
    setSaveMeal(m);
    setSaveName(mealTitle(m));
    setSaveServings("1");
  }

  function confirmSaveMeal() {
    if (!saveMeal) return;
    const entries = byMeal[saveMeal];
    if (entries.length === 0) return;
    const name = saveName.trim();
    const s = Number(saveServings);
    if (!name || !Number.isFinite(s) || s <= 0) return;

    const ingredients = mealEntriesToIngredients(
      entries,
      data.recipes,
      knownFoods,
    );
    if (ingredients.length === 0) return;

    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: newId(),
      name,
      servings: s,
      notes: `Saved from ${mealTitle(saveMeal).toLowerCase()} on ${date}`,
      ingredients,
      createdAt: now,
      updatedAt: now,
    };
    saveRecipe(recipe);
    setSaveMeal(null);
  }

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-10 text-sm text-[color:var(--quiet)]">
        Loading your diary…
      </div>
    );
  }

  const greeting = data.displayName.trim();

  return (
    <div className="space-y-6" {...daySwipe}>
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
              {greeting ? `${greeting}'s diary` : "Diary"}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              {dayHeading}
            </p>
          </div>
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ size: "icon", variant: "outline" }),
              "size-10 rounded-full border-[color:var(--line)]",
            )}
            aria-label="Open settings"
          >
            <Settings2 className="size-4" />
          </Link>
        </div>

        <WeekDayBar
          date={date}
          onChange={setDate}
          markedDates={markedDates}
          dragX={dragX}
          onDragX={setDragX}
        />

        <DaySlide
          animKey={`${date}-${animKey}`}
          dir={dir}
          dragX={dragX}
          className="space-y-6"
        >
          <div className="rounded-[1.5rem] bg-[color:var(--surface)]/90 p-5 shadow-[0_18px_40px_-28px_rgba(16,24,32,0.35)] ring-1 ring-[color:var(--line)]/70">
            <CalorieHero calories={totals.calories} goal={data.goals.calories} />
            <div className="mt-5 border-t border-[color:var(--line)]/80 pt-4">
              <MacroStrip
                nutrients={totals}
                goals={data.goals}
                hideCalories
              />
            </div>
          </div>

          <section>
            <Button
              variant="outline"
              className="h-11 rounded-full border-[color:var(--line)] px-5"
              onClick={() => {
                setSelectedRecipe(data.recipes[0]?.id ?? null);
                setServings("1");
                setRecipeOpen(true);
              }}
              disabled={data.recipes.length === 0}
            >
              Recipe
            </Button>
          </section>

          <section className="space-y-5">
            {MEALS.map((m) => {
              const addHref = `/foods?meal=${m}&date=${encodeURIComponent(date)}`;
              const mealKcal = Math.round(
                byMeal[m].reduce((a, e) => a + e.nutrients.calories, 0),
              );
              return (
                <div key={m} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-[family-name:var(--font-display)] text-base font-semibold capitalize text-[color:var(--ink)]">
                      {m}
                    </h2>
                    <div className="flex items-center gap-0.5">
                      <span className="pr-1 text-xs tabular-nums text-[color:var(--quiet)]">
                        {mealKcal} kcal
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`${mealTitle(m)} options`}
                              className="touch-target shrink-0 text-[color:var(--quiet)]"
                            />
                          }
                        >
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-44 rounded-xl border-[color:var(--line)] bg-[color:var(--surface)] p-1 shadow-lg"
                        >
                          <DropdownMenuItem
                            disabled={byMeal[m].length === 0}
                            onClick={() => openSaveMeal(m)}
                            className="cursor-pointer gap-2 rounded-lg px-2.5 py-2"
                          >
                            <BookmarkPlus className="size-4" />
                            Save as recipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {byMeal[m].length === 0 ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[color:var(--mist)]/70 px-4 py-3">
                      <p className="text-sm text-[color:var(--quiet)]">
                        Nothing logged
                      </p>
                      <Link
                        href={addHref}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-9 shrink-0 rounded-full px-3 text-[color:var(--brand)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand-deep)]",
                        )}
                      >
                        <Plus className="size-3.5" /> Add
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
                      <ul>
                        {byMeal[m].map((entry, idx) => (
                          <li
                            key={entry.id}
                            className={cn(
                              "flex items-start justify-between gap-3 px-4 py-3",
                              idx > 0 && "border-t border-[color:var(--line)]/70",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[color:var(--ink)]">
                                {entry.name}
                              </p>
                              <p className="mt-0.5 text-xs text-[color:var(--quiet)]">
                                {entry.source === "recipe"
                                  ? "Recipe"
                                  : `${entry.grams}g`}{" "}
                                · {Math.round(entry.nutrients.calories)} kcal · P{" "}
                                {entry.nutrients.protein} · C{" "}
                                {entry.nutrients.carbs} · F {entry.nutrients.fat}
                              </p>
                            </div>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Remove entry"
                              className="touch-target shrink-0"
                              onClick={() => removeEntry(entry.id)}
                            >
                              <Trash2 className="size-4 text-[color:var(--quiet)]" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-[color:var(--line)]/70">
                        <Link
                          href={addHref}
                          className="flex h-11 w-full items-center justify-center gap-1.5 text-sm font-medium text-[color:var(--brand)] transition-colors active:bg-[color:var(--mist)] hover:bg-[color:var(--mist)]"
                        >
                          <Plus className="size-3.5" /> Add
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {dayEntries.length > 0 && (
            <section className="rounded-[1.25rem] bg-[color:var(--surface)]/90 p-4 ring-1 ring-[color:var(--line)]/70">
              <NutrientPanel nutrients={totals} perLabel="day total" />
            </section>
          )}
        </DaySlide>
      </section>

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Log a recipe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Recipe</Label>
              <Select
                value={selectedRecipe}
                onValueChange={(v) => setSelectedRecipe(v)}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Choose recipe" />
                </SelectTrigger>
                <SelectContent>
                  {data.recipes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
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
                        {mealTitle(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="h-11 w-full rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
              onClick={logRecipe}
              disabled={!selectedRecipe}
            >
              Add to diary
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={saveMeal != null}
        onOpenChange={(open) => {
          if (!open) setSaveMeal(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Save as recipe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[color:var(--ink-soft)]">
              {saveMeal
                ? `Save all ${byMeal[saveMeal].length} item${byMeal[saveMeal].length === 1 ? "" : "s"} from ${mealTitle(saveMeal).toLowerCase()} as a recipe.`
                : null}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="save-recipe-name">Name</Label>
              <Input
                id="save-recipe-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Recipe name"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-recipe-servings">Servings</Label>
              <Input
                id="save-recipe-servings"
                type="number"
                min={0.25}
                step={0.25}
                value={saveServings}
                onChange={(e) => setSaveServings(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              className="h-11 w-full rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
              onClick={confirmSaveMeal}
              disabled={
                !saveName.trim() ||
                !Number.isFinite(Number(saveServings)) ||
                Number(saveServings) <= 0
              }
            >
              Save recipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
