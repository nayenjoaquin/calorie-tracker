"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import {
  CalorieHero,
  MacroStrip,
  NutrientPanel,
} from "@/components/nutrient-panel";
import { WeekDayBar, useDaySwipe } from "@/components/week-day-bar";
import {
  multiplyNutrients,
  recipeNutrientsPerServing,
} from "@/lib/recipes";
import { addNutrients } from "@/lib/nutrients";
import { newId, todayISO } from "@/lib/storage";
import type { MealType } from "@/lib/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function DiaryView() {
  const { data, ready, removeEntry, logEntry, setGoals } = useStore();
  const [date, setDate] = useState(todayISO());
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [goalDraft, setGoalDraft] = useState(data.goals);
  const daySwipe = useDaySwipe(date, setDate);

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

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 py-10 text-sm text-[color:var(--quiet)]">
        Loading your diary…
      </div>
    );
  }

  return (
    <div className="space-y-6" {...daySwipe}>
      <section className="animate-rise space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
              Diary
            </h1>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              {dayHeading}
            </p>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setGoalDraft(data.goals);
              setGoalsOpen(true);
            }}
            className="size-10 rounded-full border-[color:var(--line)]"
            aria-label="Edit goals"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>

        <WeekDayBar
          date={date}
          onChange={setDate}
          markedDates={markedDates}
        />

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
      </section>

      <section className="animate-rise-delay flex gap-2">
        <Link
          href="/foods"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-11 flex-1 rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]",
          )}
        >
          <Plus className="size-4" /> Add food
        </Link>
        <Button
          variant="outline"
          className="h-11 rounded-full border-[color:var(--line)] px-4"
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

      <section className="animate-rise-delay-2 space-y-5">
        {MEALS.map((m) => (
          <div key={m} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold capitalize text-[color:var(--ink)]">
                {m}
              </h2>
              <span className="text-xs tabular-nums text-[color:var(--quiet)]">
                {Math.round(
                  byMeal[m].reduce((a, e) => a + e.nutrients.calories, 0),
                )}{" "}
                kcal
              </span>
            </div>
            {byMeal[m].length === 0 ? (
              <p className="rounded-2xl bg-[color:var(--mist)]/70 px-4 py-3 text-sm text-[color:var(--quiet)]">
                Nothing logged
              </p>
            ) : (
              <ul className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
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
                        {entry.nutrients.protein} · C {entry.nutrients.carbs} ·
                        F {entry.nutrients.fat}
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
            )}
          </div>
        ))}
      </section>

      {dayEntries.length > 0 && (
        <section className="rounded-[1.25rem] bg-[color:var(--surface)]/90 p-4 ring-1 ring-[color:var(--line)]/70">
          <NutrientPanel nutrients={totals} perLabel="day total" />
        </section>
      )}

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
                        {m.charAt(0).toUpperCase() + m.slice(1)}
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

      <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Daily goals
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["calories", "Calories"],
                ["protein", "Protein (g)"],
                ["carbs", "Carbs (g)"],
                ["fat", "Fat (g)"],
                ["weightKg", "Target weight (kg)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  className="h-11 rounded-xl"
                  value={goalDraft[key]}
                  onChange={(e) =>
                    setGoalDraft((g) => ({
                      ...g,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button
            className="h-11 w-full rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
            onClick={() => {
              setGoals(goalDraft);
              setGoalsOpen(false);
            }}
          >
            Save goals
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
