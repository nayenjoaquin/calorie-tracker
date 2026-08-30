"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FoodSearch } from "@/components/food-search";
import { NutrientPanel } from "@/components/nutrient-panel";
import { useStore } from "@/components/store-provider";
import {
  multiplyNutrients,
  recipeNutrientsPerServing,
  recipeTotalNutrients,
} from "@/lib/recipes";
import { newId } from "@/lib/storage";
import type { FoodItem, Recipe, RecipeIngredient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Draft = {
  id?: string;
  name: string;
  servings: string;
  notes: string;
  ingredients: RecipeIngredient[];
};

const emptyDraft = (): Draft => ({
  name: "",
  servings: "1",
  notes: "",
  ingredients: [],
});

export function RecipesView() {
  const { data, ready, saveRecipe, removeRecipe } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [pendingGrams, setPendingGrams] = useState("100");
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);

  const perServingPreview = useMemo(() => {
    if (!draft || draft.ingredients.length === 0) return null;
    const servings = Number(draft.servings) || 1;
    const totals = recipeTotalNutrients({
      id: "draft",
      name: draft.name,
      servings,
      notes: draft.notes,
      ingredients: draft.ingredients,
      createdAt: "",
      updatedAt: "",
    });
    return multiplyNutrients(totals, 1 / servings);
  }, [draft]);

  function openCreate() {
    setDraft(emptyDraft());
  }

  function openEdit(recipe: Recipe) {
    setDraft({
      id: recipe.id,
      name: recipe.name,
      servings: String(recipe.servings),
      notes: recipe.notes,
      ingredients: recipe.ingredients,
    });
  }

  function addIngredient(food: FoodItem) {
    setPendingFood(food);
    setPendingGrams("100");
  }

  function confirmIngredient() {
    if (!draft || !pendingFood) return;
    const grams = Number(pendingGrams);
    if (!Number.isFinite(grams) || grams <= 0) return;
    setDraft({
      ...draft,
      ingredients: [
        ...draft.ingredients,
        { id: newId(), food: pendingFood, grams },
      ],
    });
    setPendingFood(null);
    setPickOpen(false);
  }

  function save() {
    if (!draft) return;
    const name = draft.name.trim();
    const servings = Number(draft.servings);
    if (!name || !Number.isFinite(servings) || servings <= 0) return;
    if (draft.ingredients.length === 0) return;

    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: draft.id ?? newId(),
      name,
      servings,
      notes: draft.notes.trim(),
      ingredients: draft.ingredients,
      createdAt: draft.id
        ? (data.recipes.find((r) => r.id === draft.id)?.createdAt ?? now)
        : now,
      updatedAt: now,
    };
    saveRecipe(recipe);
    setDraft(null);
  }

  if (!ready) {
    return (
      <div className="animate-pulse py-10 text-sm text-[color:var(--quiet)]">
        Loading recipes…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--quiet)]">
            Your kitchen
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[color:var(--ink)] sm:text-5xl">
            Recipes
          </h1>
          <p className="mt-2 max-w-md text-sm text-[color:var(--ink-soft)]">
            Build meals from USDA foods. Nutrition rolls up per serving
            automatically.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
        >
          <Plus className="size-4" /> New recipe
        </Button>
      </div>

      {data.recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)]/60 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--ink)]">
            No recipes yet
          </p>
          <p className="mt-2 text-sm text-[color:var(--quiet)]">
            Create one from searched USDA foods to log later in your diary.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.recipes.map((recipe) => {
            const per = recipeNutrientsPerServing(recipe);
            return (
              <li
                key={recipe.id}
                className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--ink)]">
                      {recipe.name}
                    </h2>
                    <p className="mt-1 text-xs text-[color:var(--quiet)]">
                      {recipe.ingredients.length} ingredient
                      {recipe.ingredients.length === 1 ? "" : "s"} ·{" "}
                      {recipe.servings} serving
                      {recipe.servings === 1 ? "" : "s"} ·{" "}
                      {Math.round(per.calories)} kcal / serving
                    </p>
                    {recipe.notes && (
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                        {recipe.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit recipe"
                      onClick={() => openEdit(recipe)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete recipe"
                      onClick={() => removeRecipe(recipe.id)}
                    >
                      <Trash2 className="size-4 text-[color:var(--quiet)]" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:max-w-sm">
                  <div className="rounded-lg bg-[color:var(--mist)] px-2 py-2">
                    <div className="text-[color:var(--quiet)]">Protein</div>
                    <div className="font-medium">{per.protein}g</div>
                  </div>
                  <div className="rounded-lg bg-[color:var(--mist)] px-2 py-2">
                    <div className="text-[color:var(--quiet)]">Carbs</div>
                    <div className="font-medium">{per.carbs}g</div>
                  </div>
                  <div className="rounded-lg bg-[color:var(--mist)] px-2 py-2">
                    <div className="text-[color:var(--quiet)]">Fat</div>
                    <div className="font-medium">{per.fat}g</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl">
              {draft?.id ? "Edit recipe" : "New recipe"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                  placeholder="Overnight oats"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recipe-servings">Servings</Label>
                  <Input
                    id="recipe-servings"
                    type="number"
                    min={1}
                    value={draft.servings}
                    onChange={(e) =>
                      setDraft({ ...draft, servings: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[color:var(--line)]"
                    onClick={() => setPickOpen(true)}
                  >
                    <Plus className="size-4" /> Add ingredient
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  placeholder="Optional prep notes"
                  rows={2}
                />
              </div>

              {draft.ingredients.length === 0 ? (
                <p className="text-sm text-[color:var(--quiet)]">
                  Add at least one USDA food ingredient.
                </p>
              ) : (
                <ul className="divide-y divide-[color:var(--line)]/70 rounded-xl border border-[color:var(--line)]">
                  {draft.ingredients.map((ing) => (
                    <li
                      key={ing.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">{ing.food.description}</p>
                        <p className="text-xs text-[color:var(--quiet)]">
                          {ing.grams}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 w-20"
                          value={ing.grams}
                          onChange={(e) => {
                            const grams = Number(e.target.value);
                            setDraft({
                              ...draft,
                              ingredients: draft.ingredients.map((i) =>
                                i.id === ing.id
                                  ? { ...i, grams: Number.isFinite(grams) ? grams : i.grams }
                                  : i,
                              ),
                            });
                          }}
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              ingredients: draft.ingredients.filter(
                                (i) => i.id !== ing.id,
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {perServingPreview && (
                <NutrientPanel
                  nutrients={perServingPreview}
                  perLabel="per serving"
                  compact
                />
              )}

              <Button
                className="w-full bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
                onClick={save}
                disabled={
                  !draft.name.trim() ||
                  draft.ingredients.length === 0 ||
                  !(Number(draft.servings) > 0)
                }
              >
                Save recipe
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={pickOpen} onOpenChange={setPickOpen}>
        <SheetContent className="w-full overflow-y-auto border-[color:var(--line)] bg-[color:var(--surface)] sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-[family-name:var(--font-display)] text-2xl">
              Add ingredient
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-1">
            <FoodSearch mode="pick" onPick={addIngredient} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!pendingFood}
        onOpenChange={(o) => !o && setPendingFood(null)}
      >
        <DialogContent className="border-[color:var(--line)] bg-[color:var(--surface)]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl leading-snug">
              {pendingFood?.description}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ing-grams">Grams in recipe</Label>
              <Input
                id="ing-grams"
                type="number"
                min={1}
                value={pendingGrams}
                onChange={(e) => setPendingGrams(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
              onClick={confirmIngredient}
            >
              Add to recipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
