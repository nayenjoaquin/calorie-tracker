import type { FoodItem, FoodPortion } from "./types";
import { parseOffNutrients } from "./nutrients";
import { getMockFood, searchMockFoods } from "./mock-foods";

const SEARCH_BASE = "https://search.openfoodfacts.org/search";
const PRODUCT_BASE = "https://world.openfoodfacts.org/api/v2/product";
const USER_AGENT = "Platewise/0.1 (platewise@example.com)";

type OffNutriments = Record<string, number | string | undefined>;

type OffSearchHit = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  categories_tags?: string[];
  nutriments?: OffNutriments;
  serving_size?: string;
  serving_quantity?: number | string;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: OffNutriments;
  serving_size?: string;
  serving_quantity?: number | string;
};

type OffSearchResponse = {
  hits?: OffSearchHit[];
  count?: number;
};

type OffProductResponse = {
  status?: number;
  product?: OffProduct;
};

function offFetchInit(): RequestInit {
  return {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  };
}

function normalizeCode(code: string | number | undefined): string | null {
  if (code == null) return null;
  const raw = String(code).trim();
  if (!raw) return null;
  return raw.replace(/\D/g, "") || null;
}

function formatBrands(brands: string | string[] | undefined): string | undefined {
  if (!brands) return undefined;
  if (Array.isArray(brands)) {
    const joined = brands.filter(Boolean).join(", ").trim();
    return joined || undefined;
  }
  const trimmed = brands.trim();
  return trimmed || undefined;
}

function formatDescription(
  productName: string | undefined,
  brands: string | string[] | undefined,
): string {
  const name = productName?.trim() || "Unknown product";
  const brand = formatBrands(brands);
  if (!brand) return name;

  const nameLower = name.toLowerCase();
  const extraBrands = brand
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !nameLower.includes(part.toLowerCase()));

  if (!extraBrands.length) return name;
  return `${name}, ${extraBrands.join(", ")}`;
}

function formatCategory(tags: string[] | undefined): string {
  const tag = tags?.[0];
  if (!tag) return "Packaged food";
  return tag
    .replace(/^en:/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseServingQuantity(value: number | string | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** Build household measures from Open Food Facts serving fields when grams are known. */
export function mapOffPortions(product: OffProduct): FoodPortion[] | undefined {
  const servingSize = product.serving_size?.trim();
  const servingQty = parseServingQuantity(product.serving_quantity);
  const portions: FoodPortion[] = [];
  const seen = new Set<string>();

  function push(label: string, gramWeight: number) {
    const key = `${label.toLowerCase()}|${gramWeight}`;
    if (seen.has(key)) return;
    seen.add(key);
    portions.push({ label, gramWeight });
  }

  if (servingSize) {
    const gramMatch = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (gramMatch) {
      const grams = Number(gramMatch[1].replace(",", "."));
      if (Number.isFinite(grams) && grams > 0) {
        push(servingSize, grams);
      }
    } else if (servingQty != null && !/\bml\b/i.test(servingSize)) {
      push(servingSize, servingQty);
    }
  } else if (servingQty != null) {
    push(`1 serving (${servingQty} g)`, servingQty);
  }

  return portions.length ? portions : undefined;
}

function mapSearchFood(hit: OffSearchHit): FoodItem | null {
  const code = normalizeCode(hit.code);
  if (!code) return null;

  return {
    fdcId: code,
    description: formatDescription(hit.product_name, hit.brands),
    brandOwner: formatBrands(hit.brands),
    dataType: formatCategory(hit.categories_tags),
    nutrientsPer100g: parseOffNutrients(hit.nutriments),
  };
}

function mapDetailFood(product: OffProduct): FoodItem {
  const code = normalizeCode(product.code) ?? "0";
  const portions = mapOffPortions(product);

  return {
    fdcId: code,
    description: formatDescription(product.product_name, product.brands),
    brandOwner: formatBrands(product.brands),
    dataType: formatCategory(product.categories_tags),
    nutrientsPer100g: parseOffNutrients(product.nutriments),
    ...(portions ? { portions } : {}),
  };
}

export type FoodSearchResult = {
  foods: FoodItem[];
  source: "openfoodfacts" | "mock";
  message?: string;
};

export async function searchFoods(query: string): Promise<FoodSearchResult> {
  const q = query.trim();
  if (!q) {
    return {
      foods: searchMockFoods(""),
      source: "mock",
      message: "Showing sample foods. Search to query Open Food Facts.",
    };
  }

  try {
    const url = new URL(SEARCH_BASE);
    url.searchParams.set("q", q);
    url.searchParams.set("page_size", "15");

    const res = await fetch(url.toString(), offFetchInit());

    if (!res.ok) {
      throw new Error(`Open Food Facts search failed (${res.status})`);
    }

    const data = (await res.json()) as OffSearchResponse;
    const foods = (data.hits ?? [])
      .map(mapSearchFood)
      .filter((food): food is FoodItem => food != null);

    if (!foods.length) {
      const mock = searchMockFoods(q);
      return {
        foods: mock,
        source: mock.length ? "mock" : "openfoodfacts",
        message: mock.length
          ? "No Open Food Facts matches. Showing offline samples that match your query."
          : "No foods found.",
      };
    }

    return { foods, source: "openfoodfacts" };
  } catch {
    const mock = searchMockFoods(q);
    return {
      foods: mock,
      source: "mock",
      message:
        "Open Food Facts is unavailable. Using offline sample foods.",
    };
  }
}

export async function getFoodById(
  code: string,
): Promise<{
  food: FoodItem;
  source: "openfoodfacts" | "mock";
  message?: string;
}> {
  const normalized = normalizeCode(code);
  if (!normalized) {
    throw new Error("Invalid product code");
  }

  try {
    const url = new URL(`${PRODUCT_BASE}/${normalized}`);
    url.searchParams.set(
      "fields",
      "code,product_name,brands,categories_tags,nutriments,serving_size,serving_quantity",
    );

    const res = await fetch(url.toString(), {
      ...offFetchInit(),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Open Food Facts detail failed (${res.status})`);
    }

    const data = (await res.json()) as OffProductResponse;
    if (data.status !== 1 || !data.product) {
      throw new Error("Product not found");
    }

    return { food: mapDetailFood(data.product), source: "openfoodfacts" };
  } catch {
    const mock = getMockFood(normalized);
    if (mock) {
      return {
        food: mock,
        source: "mock",
        message: "Open Food Facts is unavailable. Using offline sample nutrients.",
      };
    }
    throw new Error("Food not found");
  }
}
