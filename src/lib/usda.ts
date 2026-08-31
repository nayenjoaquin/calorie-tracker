import type { FoodItem, FoodPortion } from "./types";
import { parseUsdaNutrients } from "./nutrients";
import { getMockFood, searchMockFoods } from "./mock-foods";

const BASE = "https://api.nal.usda.gov/fdc/v1";

function apiKey(): string {
  return process.env.USDA_FDC_API_KEY?.trim() || "DEMO_KEY";
}

type UsdaSearchFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
  foodNutrients?: Array<{
    nutrientId?: number;
    value?: number;
    nutrientName?: string;
    unitName?: string;
  }>;
};

type UsdaFoodPortion = {
  gramWeight?: number;
  amount?: number;
  modifier?: string;
  portionDescription?: string;
  measureUnit?: {
    id?: number;
    name?: string;
    abbreviation?: string;
  };
};

type UsdaFoodDetail = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
  foodNutrients?: Array<{
    nutrient?: { id?: number; name?: string; unitName?: string };
    nutrientId?: number;
    amount?: number;
    value?: number;
  }>;
  foodPortions?: UsdaFoodPortion[];
};

function isUndeterminedUnit(unit?: UsdaFoodPortion["measureUnit"]): boolean {
  if (!unit) return true;
  if (unit.id === 9999) return true;
  const name = unit.name?.trim().toLowerCase();
  return !name || name === "undetermined";
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(amount);
}

/** Build a human label like "1 cup" / "1 NLEA serving" from USDA portion fields. */
export function formatFoodPortionLabel(portion: UsdaFoodPortion): string | null {
  const desc = portion.portionDescription?.trim();
  if (desc) return desc;

  const amount =
    portion.amount != null && Number.isFinite(portion.amount) && portion.amount > 0
      ? portion.amount
      : null;
  const amountStr = amount != null ? formatAmount(amount) : null;
  const modifier = portion.modifier?.trim() || null;

  if (isUndeterminedUnit(portion.measureUnit)) {
    // SR Legacy / Survey-style: amount + modifier (e.g. "1 cup, sliced")
    if (amountStr && modifier) return `${amountStr} ${modifier}`;
    if (modifier) return modifier;
    return null;
  }

  const unitName = portion.measureUnit?.name?.trim();
  const unitAbbrev = portion.measureUnit?.abbreviation?.trim();
  const unit =
    unitAbbrev && unitAbbrev.toLowerCase() !== "undetermined"
      ? unitAbbrev
      : unitName!;

  let label = amountStr ? `${amountStr} ${unit}` : unit;
  if (modifier && modifier.toLowerCase() !== "undetermined") {
    label = `${label} ${modifier}`;
  }
  return label;
}

export function mapFoodPortions(
  portions: UsdaFoodPortion[] | undefined,
): FoodPortion[] | undefined {
  if (!portions?.length) return undefined;

  const mapped: FoodPortion[] = [];
  const seen = new Set<string>();

  for (const portion of portions) {
    const gramWeight = portion.gramWeight;
    if (gramWeight == null || !Number.isFinite(gramWeight) || gramWeight <= 0) {
      continue;
    }
    const label = formatFoodPortionLabel(portion);
    if (!label) continue;

    const key = `${label.toLowerCase()}|${gramWeight}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push({ label, gramWeight });
  }

  return mapped.length ? mapped : undefined;
}

function mapSearchFood(item: UsdaSearchFood): FoodItem {
  return {
    fdcId: item.fdcId,
    description: item.description,
    brandOwner: item.brandOwner,
    dataType: item.dataType ?? "Unknown",
    nutrientsPer100g: parseUsdaNutrients(item.foodNutrients),
  };
}

function mapDetailFood(item: UsdaFoodDetail): FoodItem {
  const portions = mapFoodPortions(item.foodPortions);
  return {
    fdcId: item.fdcId,
    description: item.description,
    brandOwner: item.brandOwner,
    dataType: item.dataType ?? "Unknown",
    nutrientsPer100g: parseUsdaNutrients(item.foodNutrients),
    ...(portions ? { portions } : {}),
  };
}

export type FoodSearchResult = {
  foods: FoodItem[];
  source: "usda" | "mock";
  message?: string;
};

export async function searchFoods(query: string): Promise<FoodSearchResult> {
  const q = query.trim();
  if (!q) {
    return {
      foods: searchMockFoods(""),
      source: "mock",
      message: "Showing sample foods. Search to query USDA FoodData Central.",
    };
  }

  try {
    const url = new URL(`${BASE}/foods/search`);
    url.searchParams.set("api_key", apiKey());
    url.searchParams.set("query", q);
    url.searchParams.set("pageSize", "15");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`USDA search failed (${res.status})`);
    }

    const data = (await res.json()) as { foods?: UsdaSearchFood[] };
    const foods = (data.foods ?? []).map(mapSearchFood);

    if (!foods.length) {
      const mock = searchMockFoods(q);
      return {
        foods: mock,
        source: mock.length ? "mock" : "usda",
        message: mock.length
          ? "No USDA matches for that search. Showing offline sample foods."
          : "No foods found. Try a different search term.",
      };
    }

    return { foods, source: "usda" };
  } catch {
    const mock = searchMockFoods(q);
    if (mock.length) {
      return {
        foods: mock,
        source: "mock",
        message:
          "USDA is temporarily unavailable. Showing offline sample foods.",
      };
    }
    return {
      foods: [],
      source: "usda",
      message:
        "Couldn't reach USDA right now. Try again in a moment.",
    };
  }
}

export async function getFoodById(
  fdcId: number,
): Promise<{ food: FoodItem; source: "usda" | "mock"; message?: string }> {
  try {
    const url = new URL(`${BASE}/food/${fdcId}`);
    url.searchParams.set("api_key", apiKey());

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`USDA detail failed (${res.status})`);
    }

    const data = (await res.json()) as UsdaFoodDetail;
    return { food: mapDetailFood(data), source: "usda" };
  } catch {
    const mock = getMockFood(fdcId);
    if (mock) {
      return {
        food: mock,
        source: "mock",
        message: "USDA API unavailable. Using offline sample nutrients.",
      };
    }
    throw new Error("Food not found");
  }
}
