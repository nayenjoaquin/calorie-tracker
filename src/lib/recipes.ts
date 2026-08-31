import { addNutrients, round, scaleNutrients } from "@/lib/nutrients";
import { newId } from "@/lib/storage";
import type {
  DiaryEntry,
  FoodItem,
  Nutrients,
  Recipe,
  RecipeIngredient,
} from "@/lib/types";
import { EMPTY_NUTRIENTS } from "@/lib/types";

export function multiplyNutrients(n: Nutrients, factor: number): Nutrients {
  const out = { ...EMPTY_NUTRIENTS };
  for (const key of Object.keys(out) as (keyof Nutrients)[]) {
    out[key] = round(n[key] * factor, key === "calories" ? 0 : 2);
  }
  return out;
}

export function recipeTotalNutrients(recipe: Recipe): Nutrients {
  return recipe.ingredients.reduce(
    (acc, ing) =>
      addNutrients(acc, scaleNutrients(ing.food.nutrientsPer100g, ing.grams)),
    { ...EMPTY_NUTRIENTS },
  );
}

export function recipeNutrientsPerServing(recipe: Recipe): Nutrients {
  return multiplyNutrients(
    recipeTotalNutrients(recipe),
    1 / (recipe.servings || 1),
  );
}

/** Rebuild a FoodItem when we only have a diary entry's scaled nutrients. */
function foodFromDiaryEntry(entry: DiaryEntry): FoodItem {
  const grams = entry.grams > 0 ? entry.grams : 100;
  const name = entry.name.replace(/\s*\(\d+(?:\.\d+)? servings?\)$/i, "").trim();
  return {
    fdcId: entry.fdcId ?? "",
    description: name || entry.name,
    dataType: entry.source === "recipe" ? "Recipe" : "Diary",
    nutrientsPer100g: multiplyNutrients(entry.nutrients, 100 / grams),
  };
}

function findKnownFood(
  fdcId: string | undefined,
  catalog: FoodItem[],
): FoodItem | undefined {
  if (!fdcId?.trim()) return undefined;
  return catalog.find((f) => f.fdcId === fdcId);
}

/**
 * Convert a meal's diary entries into recipe ingredients.
 * Recipe-sourced entries expand into their original ingredients (scaled).
 * Food entries reuse known foods when available, otherwise reconstruct
 * nutrients-per-100g from the logged amount.
 */
export function mealEntriesToIngredients(
  entries: DiaryEntry[],
  recipes: Recipe[],
  knownFoods: FoodItem[] = [],
): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];

  for (const entry of entries) {
    if (entry.source === "recipe" && entry.recipeId) {
      const recipe = recipes.find((r) => r.id === entry.recipeId);
      if (recipe && recipe.ingredients.length > 0) {
        const totalGrams = recipe.ingredients.reduce((a, i) => a + i.grams, 0);
        const scale = totalGrams > 0 ? entry.grams / totalGrams : 1;
        for (const ing of recipe.ingredients) {
          ingredients.push({
            id: newId(),
            food: ing.food,
            grams: round(ing.grams * scale, 1),
          });
        }
        continue;
      }
    }

    const known = findKnownFood(entry.fdcId, knownFoods);
    ingredients.push({
      id: newId(),
      food: known ?? foodFromDiaryEntry(entry),
      grams: entry.grams > 0 ? entry.grams : 100,
    });
  }

  return ingredients;
}
