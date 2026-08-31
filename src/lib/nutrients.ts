import type { Nutrients } from "./types";
import { EMPTY_NUTRIENTS } from "./types";

/** Legacy USDA FoodData Central nutrient IDs (offline mock metadata). */
export const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
  cholesterol: 1253,
  calcium: 1087,
  iron: 1089,
  magnesium: 1090,
  potassium: 1092,
  zinc: 1095,
  vitaminA: 1106,
  vitaminC: 1162,
  vitaminD: 1114,
  vitaminE: 1109,
  vitaminK: 1185,
  folate: 1177,
  vitaminB12: 1178,
} as const;

export type NutrientKey = keyof typeof NUTRIENT_IDS;

export const MACRO_KEYS: NutrientKey[] = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
];

export const MICRO_KEYS: NutrientKey[] = [
  "sodium",
  "cholesterol",
  "calcium",
  "iron",
  "magnesium",
  "potassium",
  "zinc",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminK",
  "folate",
  "vitaminB12",
];

export const NUTRIENT_META: Record<
  NutrientKey,
  { label: string; unit: string; short: string }
> = {
  calories: { label: "Calories", unit: "kcal", short: "Cal" },
  protein: { label: "Protein", unit: "g", short: "P" },
  carbs: { label: "Carbs", unit: "g", short: "C" },
  fat: { label: "Fat", unit: "g", short: "F" },
  fiber: { label: "Fiber", unit: "g", short: "Fiber" },
  sugar: { label: "Sugars", unit: "g", short: "Sugar" },
  sodium: { label: "Sodium", unit: "mg", short: "Na" },
  cholesterol: { label: "Cholesterol", unit: "mg", short: "Chol" },
  calcium: { label: "Calcium", unit: "mg", short: "Ca" },
  iron: { label: "Iron", unit: "mg", short: "Fe" },
  magnesium: { label: "Magnesium", unit: "mg", short: "Mg" },
  potassium: { label: "Potassium", unit: "mg", short: "K" },
  zinc: { label: "Zinc", unit: "mg", short: "Zn" },
  vitaminA: { label: "Vitamin A", unit: "µg", short: "A" },
  vitaminC: { label: "Vitamin C", unit: "mg", short: "C" },
  vitaminD: { label: "Vitamin D", unit: "µg", short: "D" },
  vitaminE: { label: "Vitamin E", unit: "mg", short: "E" },
  vitaminK: { label: "Vitamin K", unit: "µg", short: "K" },
  folate: { label: "Folate", unit: "µg", short: "B9" },
  vitaminB12: { label: "Vitamin B12", unit: "µg", short: "B12" },
};

type UsdaFoodNutrient = {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
  amount?: number;
  nutrient?: {
    id?: number;
    number?: string;
    name?: string;
    unitName?: string;
  };
};

const ID_TO_KEY = Object.fromEntries(
  Object.entries(NUTRIENT_IDS).map(([key, id]) => [id, key as NutrientKey]),
) as Record<number, NutrientKey>;

export function parseUsdaNutrients(
  foodNutrients: UsdaFoodNutrient[] | undefined,
): Nutrients {
  const result: Nutrients = { ...EMPTY_NUTRIENTS };
  if (!foodNutrients?.length) return result;

  for (const item of foodNutrients) {
    const id = item.nutrientId ?? item.nutrient?.id;
    if (id == null) continue;
    const key = ID_TO_KEY[id];
    if (!key) continue;
    const value = item.value ?? item.amount ?? 0;
    result[key] = Number.isFinite(value) ? value : 0;
  }

  return result;
}

type OffNutriments = Record<string, number | string | undefined>;

function offNumber(
  nutriments: OffNutriments | undefined,
  key: string,
): number | undefined {
  const value = nutriments?.[`${key}_100g`];
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function gramsToMg(value: number | undefined): number {
  if (value == null) return 0;
  return value * 1000;
}

export function parseOffNutrients(
  nutriments: OffNutriments | undefined,
): Nutrients {
  const result: Nutrients = { ...EMPTY_NUTRIENTS };
  if (!nutriments) return result;

  const calories =
    offNumber(nutriments, "energy-kcal") ??
    (offNumber(nutriments, "energy")
      ? offNumber(nutriments, "energy")! / 4.184
      : undefined);
  if (calories != null) result.calories = calories;

  const protein = offNumber(nutriments, "proteins");
  if (protein != null) result.protein = protein;

  const carbs = offNumber(nutriments, "carbohydrates");
  if (carbs != null) result.carbs = carbs;

  const fat = offNumber(nutriments, "fat");
  if (fat != null) result.fat = fat;

  const fiber = offNumber(nutriments, "fiber");
  if (fiber != null) result.fiber = fiber;

  const sugar = offNumber(nutriments, "sugars");
  if (sugar != null) result.sugar = sugar;

  result.sodium = gramsToMg(offNumber(nutriments, "sodium"));
  result.cholesterol = gramsToMg(offNumber(nutriments, "cholesterol"));
  result.calcium = gramsToMg(offNumber(nutriments, "calcium"));
  result.iron = gramsToMg(offNumber(nutriments, "iron"));
  result.magnesium = gramsToMg(offNumber(nutriments, "magnesium"));
  result.potassium = gramsToMg(offNumber(nutriments, "potassium"));
  result.zinc = gramsToMg(offNumber(nutriments, "zinc"));

  const vitaminA = offNumber(nutriments, "vitamin-a");
  if (vitaminA != null) result.vitaminA = vitaminA;

  const vitaminC = offNumber(nutriments, "vitamin-c");
  if (vitaminC != null) result.vitaminC = vitaminC;

  const vitaminD = offNumber(nutriments, "vitamin-d");
  if (vitaminD != null) result.vitaminD = vitaminD;

  const vitaminE = offNumber(nutriments, "vitamin-e");
  if (vitaminE != null) result.vitaminE = vitaminE;

  const vitaminK = offNumber(nutriments, "vitamin-k");
  if (vitaminK != null) result.vitaminK = vitaminK;

  const folate = offNumber(nutriments, "folates");
  if (folate != null) result.folate = folate;

  const vitaminB12 = offNumber(nutriments, "vitamin-b12");
  if (vitaminB12 != null) result.vitaminB12 = vitaminB12;

  return result;
}

export function scaleNutrients(n: Nutrients, grams: number): Nutrients {
  const factor = grams / 100;
  const out = { ...EMPTY_NUTRIENTS };
  for (const key of Object.keys(out) as (keyof Nutrients)[]) {
    out[key] = round(n[key] * factor, key === "calories" ? 0 : 2);
  }
  return out;
}

export function addNutrients(...items: Nutrients[]): Nutrients {
  const out = { ...EMPTY_NUTRIENTS };
  for (const item of items) {
    for (const key of Object.keys(out) as (keyof Nutrients)[]) {
      out[key] = round(out[key] + item[key], key === "calories" ? 0 : 2);
    }
  }
  return out;
}

export function round(value: number, digits = 1): number {
  const m = 10 ** digits;
  return Math.round(value * m) / m;
}

export function formatNutrient(key: NutrientKey, value: number): string {
  const { unit } = NUTRIENT_META[key];
  const digits = key === "calories" ? 0 : value >= 10 ? 0 : 1;
  return `${round(value, digits)} ${unit}`;
}
