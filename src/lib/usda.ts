import type { FoodItem } from "./types";
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
};

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
  return {
    fdcId: item.fdcId,
    description: item.description,
    brandOwner: item.brandOwner,
    dataType: item.dataType ?? "Unknown",
    nutrientsPer100g: parseUsdaNutrients(item.foodNutrients),
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
          ? "No USDA matches. Showing offline samples that match your query."
          : "No foods found.",
      };
    }

    return { foods, source: "usda" };
  } catch {
    const mock = searchMockFoods(q);
    return {
      foods: mock,
      source: "mock",
      message:
        "USDA API unavailable. Using offline sample foods. Set USDA_FDC_API_KEY for live data.",
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
