import type { FoodItem, FoodPortion, Nutrients } from "./types";
import { EMPTY_NUTRIENTS } from "./types";

function food(
  fdcId: number,
  description: string,
  dataType: string,
  nutrients: Partial<Nutrients>,
  brandOwner?: string,
  portions?: FoodPortion[],
): FoodItem {
  return {
    fdcId,
    description,
    dataType,
    brandOwner,
    nutrientsPer100g: { ...EMPTY_NUTRIENTS, ...nutrients },
    ...(portions?.length ? { portions } : {}),
  };
}

/** Offline sample foods used when USDA API is unavailable */
export const MOCK_FOODS: FoodItem[] = [
  food(
    171077,
    "Chicken, broilers or fryers, breast, meat only, cooked, grilled",
    "SR Legacy",
    {
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0,
      sodium: 74,
      cholesterol: 85,
      potassium: 256,
      iron: 0.5,
      zinc: 0.9,
      vitaminB12: 0.3,
    },
    undefined,
    [
      { label: "1 cup, chopped or diced", gramWeight: 140 },
      { label: "1 unit (yield from 1 lb ready-to-cook)", gramWeight: 95 },
    ],
  ),
  food(
    170567,
    "Egg, whole, cooked, scrambled",
    "SR Legacy",
    {
      calories: 149,
      protein: 9.99,
      fat: 11,
      carbs: 1.61,
      cholesterol: 352,
      sodium: 152,
      calcium: 66,
      iron: 1.3,
      vitaminA: 160,
      vitaminD: 1.7,
      vitaminB12: 0.76,
    },
    undefined,
    [
      { label: "1 large", gramWeight: 61 },
      { label: "1 cup", gramWeight: 220 },
    ],
  ),
  food(
    168462,
    "Bananas, raw",
    "SR Legacy",
    {
      calories: 89,
      protein: 1.09,
      fat: 0.33,
      carbs: 22.84,
      fiber: 2.6,
      sugar: 12.23,
      potassium: 358,
      magnesium: 27,
      vitaminC: 8.7,
      vitaminB12: 0,
      folate: 20,
    },
    undefined,
    [
      { label: "1 medium (7\" to 7-7/8\" long)", gramWeight: 118 },
      { label: "1 cup, sliced", gramWeight: 150 },
    ],
  ),
  food(
    168421,
    "Oats, regular and quick, unenriched, cooked with water",
    "SR Legacy",
    {
      calories: 71,
      protein: 2.54,
      fat: 1.52,
      carbs: 12,
      fiber: 1.7,
      iron: 0.9,
      magnesium: 27,
      zinc: 1,
    },
    undefined,
    [
      { label: "1 cup", gramWeight: 234 },
      { label: "1 NLEA serving", gramWeight: 40 },
    ],
  ),
  food(
    170457,
    "Salmon, Atlantic, farmed, cooked, dry heat",
    "SR Legacy",
    {
      calories: 206,
      protein: 22.1,
      fat: 12.35,
      carbs: 0,
      cholesterol: 63,
      sodium: 61,
      potassium: 384,
      vitaminD: 13.1,
      vitaminB12: 2.8,
      vitaminA: 40,
    },
    undefined,
    [{ label: "1 fillet", gramWeight: 154 }],
  ),
  food(169231, "Broccoli, raw", "SR Legacy", {
    calories: 34,
    protein: 2.82,
    fat: 0.37,
    carbs: 6.64,
    fiber: 2.6,
    sugar: 1.7,
    vitaminC: 89.2,
    vitaminK: 101.6,
    folate: 63,
    potassium: 316,
    calcium: 47,
  }, undefined, [
    { label: "1 cup chopped", gramWeight: 91 },
    { label: "1 spear (about 5\" long)", gramWeight: 31 },
  ]),
  food(167514, "Rice, white, long-grain, regular, enriched, cooked", "SR Legacy", {
    calories: 130,
    protein: 2.69,
    fat: 0.28,
    carbs: 28.17,
    fiber: 0.4,
    iron: 1.2,
    folate: 58,
  }, undefined, [
    { label: "1 cup", gramWeight: 158 },
  ]),
  food(
    173944,
    "Cheese, cheddar",
    "SR Legacy",
    {
      calories: 403,
      protein: 22.87,
      fat: 33.31,
      carbs: 3.37,
      sodium: 621,
      calcium: 710,
      cholesterol: 105,
      vitaminA: 265,
      zinc: 3.1,
    },
    undefined,
    [
      { label: "1 cup, diced", gramWeight: 132 },
      { label: "1 slice (1 oz)", gramWeight: 28 },
    ],
  ),
  food(
    167765,
    "Yogurt, Greek, plain, nonfat",
    "SR Legacy",
    {
      calories: 59,
      protein: 10.19,
      fat: 0.39,
      carbs: 3.6,
      sugar: 3.24,
      calcium: 110,
      potassium: 141,
      vitaminB12: 0.75,
    },
    undefined,
    [
      { label: "1 container (6 oz)", gramWeight: 170 },
      { label: "1 cup", gramWeight: 245 },
    ],
  ),
  food(
    168203,
    "Almonds, raw",
    "SR Legacy",
    {
      calories: 579,
      protein: 21.15,
      fat: 49.93,
      carbs: 21.55,
      fiber: 12.5,
      magnesium: 270,
      calcium: 269,
      vitaminE: 25.63,
      iron: 3.71,
      zinc: 3.12,
    },
    undefined,
    [
      { label: "1 cup, whole", gramWeight: 143 },
      { label: "1 oz (23 kernels)", gramWeight: 28 },
    ],
  ),
  food(
    170110,
    "Sweet potato, cooked, baked in skin, without salt",
    "SR Legacy",
    {
      calories: 90,
      protein: 2.01,
      fat: 0.15,
      carbs: 20.71,
      fiber: 3.3,
      sugar: 6.48,
      vitaminA: 961,
      vitaminC: 19.6,
      potassium: 475,
    },
    undefined,
    [
      { label: "1 medium", gramWeight: 114 },
      { label: "1 cup", gramWeight: 200 },
    ],
  ),
  food(
    169414,
    "Avocado, raw, all commercial varieties",
    "SR Legacy",
    {
      calories: 160,
      protein: 2,
      fat: 14.66,
      carbs: 8.53,
      fiber: 6.7,
      potassium: 485,
      magnesium: 29,
      vitaminK: 21,
      vitaminE: 2.07,
    },
    undefined,
    [
      { label: "1 cup, cubes", gramWeight: 150 },
      { label: "1 fruit", gramWeight: 201 },
    ],
  ),
];

export function searchMockFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_FOODS.slice(0, 8);
  return MOCK_FOODS.filter(
    (f) =>
      f.description.toLowerCase().includes(q) ||
      f.brandOwner?.toLowerCase().includes(q),
  );
}

export function getMockFood(fdcId: number): FoodItem | undefined {
  return MOCK_FOODS.find((f) => f.fdcId === fdcId);
}
