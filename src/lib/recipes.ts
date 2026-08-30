import { addNutrients, round, scaleNutrients } from "@/lib/nutrients";
import type { Nutrients, Recipe } from "@/lib/types";
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
