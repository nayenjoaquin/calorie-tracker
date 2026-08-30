"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { MacroStrip, NutrientPanel } from "@/components/nutrient-panel";
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
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--quiet)]">
              Today&apos;s plate
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[color:var(--ink)] sm:text-5xl">
              Platewise
            </h1>
            <p className="mt-2 max-w-md text-sm text-[color:var(--ink-soft)]">
              Log meals from USDA foods or your recipes. Macros and micros stay
              on this device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto border-[color:var(--line)] bg-[color:var(--surface)]"
            />
            <Button
              variant="outline"
              onClick={() => {
                setGoalDraft(data.goals);
                setGoalsOpen(true);
              }}
              className="border-[color:var(--line)]"
            >
              Goals
            </Button>
          </div>
        </div>

        <div className="animate-rise rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-5 shadow-[0_20px_50px_-40px_rgba(30,55,40,0.45)]">
          <MacroStrip nutrients={totals} goals={data.goals} />
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/foods"
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]",
          )}
        >
          <Plus className="size-4" /> Add food
        </Link>
        <Button
          variant="outline"
          className="border-[color:var(--line)]"
          onClick={() => {
            setSelectedRecipe(data.recipes[0]?.id ?? null);
            setServings("1");
            setRecipeOpen(true);
          }}
          disabled={data.recipes.length === 0}
        >
          Log recipe
        </Button>
        {data.recipes.length === 0 && (
          <Link
            href="/recipes"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Create a recipe first
          </Link>
        )}
      </section>

      <section className="space-y-6">
        {MEALS.map((m) => (
          <div key={m} className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl capitalize text-[color:var(--ink)]">
              {m}
            </h2>
            {byMeal[m].length === 0 ? (
              <p className="text-sm text-[color:var(--quiet)]">Nothing logged.</p>
            ) : (
              <ul className="divide-y divide-[color:var(--line)]/70 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]">
                {byMeal[m].map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[color:var(--ink)]">
                        {entry.name}
                      </p>
                      <p className="text-xs text-[color:var(--quiet)]">
                        {entry.source === "recipe"
                          ? "Recipe"
                          : `${entry.grams}g`}{" "}
                        · {Math.round(entry.nutrients.calories)} kcal · P{" "}
                        {entry.nutrients.protein}g · C {entry.nutrients.carbs}g ·
                        F {entry.nutrients.fat}g
                      </p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove entry"
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
        <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-5">
          <NutrientPanel nutrients={totals} perLabel="day total" />
        </section>
      )}

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl">
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
                <SelectTrigger className="w-full">
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
            <Button
              className="w-full bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
              onClick={logRecipe}
              disabled={!selectedRecipe}
            >
              Add to diary
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
        <DialogContent className="border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl">
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
            className="w-full bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
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
