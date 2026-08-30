export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  calcium: number;
  iron: number;
  magnesium: number;
  potassium: number;
  zinc: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  folate: number;
  vitaminB12: number;
};

export type FoodItem = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
  nutrientsPer100g: Nutrients;
};

export type RecipeIngredient = {
  id: string;
  food: FoodItem;
  grams: number;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DiaryEntry = {
  id: string;
  date: string;
  meal: MealType;
  name: string;
  source: "food" | "recipe";
  fdcId?: number;
  recipeId?: string;
  grams: number;
  nutrients: Nutrients;
};

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  note: string;
};

export type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightKg: number;
};

export type AppData = {
  displayName: string;
  recipes: Recipe[];
  diary: DiaryEntry[];
  weights: WeightEntry[];
  goals: Goals;
};

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  cholesterol: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  potassium: 0,
  zinc: 0,
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminK: 0,
  folate: 0,
  vitaminB12: 0,
};

export const DEFAULT_GOALS: Goals = {
  calories: 2200,
  protein: 150,
  carbs: 220,
  fat: 70,
  weightKg: 75,
};
