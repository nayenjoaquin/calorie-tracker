import type {
  AppData,
  DiaryEntry,
  FoodItem,
  Goals,
  Recipe,
  WeightEntry,
} from "./types";
import { DEFAULT_GOALS } from "./types";

const STORAGE_KEY = "platewise-data-v1";
const MAX_RECENT_FOODS = 20;

export function createDefaultData(): AppData {
  return {
    displayName: "",
    recipes: [],
    diary: [],
    weights: [],
    goals: { ...DEFAULT_GOALS },
    recentFoods: [],
    favoriteFoods: [],
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      displayName:
        typeof parsed.displayName === "string" ? parsed.displayName : "",
      recipes: parsed.recipes ?? [],
      diary: parsed.diary ?? [],
      weights: parsed.weights ?? [],
      goals: { ...DEFAULT_GOALS, ...parsed.goals },
      recentFoods: parsed.recentFoods ?? [],
      favoriteFoods: parsed.favoriteFoods ?? [],
    };
  } catch {
    return createDefaultData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function upsertRecipe(data: AppData, recipe: Recipe): AppData {
  const idx = data.recipes.findIndex((r) => r.id === recipe.id);
  const recipes =
    idx >= 0
      ? data.recipes.map((r, i) => (i === idx ? recipe : r))
      : [recipe, ...data.recipes];
  return { ...data, recipes };
}

export function deleteRecipe(data: AppData, id: string): AppData {
  return { ...data, recipes: data.recipes.filter((r) => r.id !== id) };
}

export function addDiaryEntry(data: AppData, entry: DiaryEntry): AppData {
  return { ...data, diary: [entry, ...data.diary] };
}

export function deleteDiaryEntry(data: AppData, id: string): AppData {
  return { ...data, diary: data.diary.filter((e) => e.id !== id) };
}

export function upsertWeight(data: AppData, entry: WeightEntry): AppData {
  const sameDay = data.weights.findIndex((w) => w.date === entry.date);
  const weights =
    sameDay >= 0
      ? data.weights.map((w, i) => (i === sameDay ? entry : w))
      : [...data.weights, entry].sort((a, b) => a.date.localeCompare(b.date));
  return { ...data, weights };
}

export function deleteWeight(data: AppData, id: string): AppData {
  return { ...data, weights: data.weights.filter((w) => w.id !== id) };
}

export function updateGoals(data: AppData, goals: Goals): AppData {
  return { ...data, goals };
}

export function addRecentFood(data: AppData, food: FoodItem): AppData {
  const recentFoods = [
    food,
    ...data.recentFoods.filter((f) => f.fdcId !== food.fdcId),
  ].slice(0, MAX_RECENT_FOODS);
  return { ...data, recentFoods };
}

export function toggleFavoriteFood(data: AppData, food: FoodItem): AppData {
  const exists = data.favoriteFoods.some((f) => f.fdcId === food.fdcId);
  const favoriteFoods = exists
    ? data.favoriteFoods.filter((f) => f.fdcId !== food.fdcId)
    : [food, ...data.favoriteFoods];
  return { ...data, favoriteFoods };
}

export function isFavoriteFood(data: AppData, fdcId: number): boolean {
  return data.favoriteFoods.some((f) => f.fdcId === fdcId);
}

export function updateDisplayName(data: AppData, displayName: string): AppData {
  return { ...data, displayName: displayName.trim() };
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
