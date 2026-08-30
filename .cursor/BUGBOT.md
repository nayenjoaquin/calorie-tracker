# Platewise — Bugbot review guidelines

Focus on real user-facing bugs and data integrity. Prefer high-confidence issues over style nits.

## Product context

Single-device calorie tracker (Next.js App Router). Diary, recipes, weights, and goals persist in browser `localStorage` (`platewise-data-v1`). USDA FoodData Central is queried via `/api/foods/*` with DEMO_KEY / offline mock fallback. No auth or server database.

## Priority areas

### Diary date navigation and swipe animation

- Day changes via week bar tap, swipe, or week chevrons must keep `date`, slide direction, and `dragX` consistent.
- Swiping must not skip days, double-advance, or leave content stuck mid-drag (`dragX` not reset).
- Animations must not hide or permanently clip meal lists / nutrient panels (`overflow` / `transform` bugs).
- Logging a recipe must use the **currently selected diary date**, not always today.

### localStorage and schema

- Loading corrupted or partial JSON must not crash the app; defaults should merge safely.
- New fields on `AppData` must not wipe existing diary/recipes/weights on upgrade.
- Saves should not thrash or write invalid structures that clear user data on reload.

### USDA search and nutrient math

- Search / detail API failures must fall back to mock foods without empty-crash UI.
- Nutrient scaling is per 100g → grams; recipe totals and per-serving math must not double-count or divide by zero (`servings`).
- Micronutrient parsing from USDA IDs must not invent values or drop macros when micros are missing.

### Recipes and diary logging

- Recipe CRUD must not orphan invalid ingredients or save empty recipes.
- Deleting a recipe should not corrupt diary entries that referenced it (entries store denormalized nutrients/name).
- Meal totals and day macros must match the sum of visible entries for that date.

### Weight progress

- One weigh-in per calendar day (upsert); chart domain must remain readable with 2+ points.
- Invalid weight/date must not write `NaN` into storage.

### Mobile UI / navigation

- Bottom nav and sticky header must remain usable (~390px width); primary actions must not be covered.
- Dialogs/sheets must close and return focus without trapping scroll on iOS-style viewports.

## Out of scope for Bugbot

- Pure visual polish, copy edits, or refactors with no behavioral risk.
- Requesting auth, backend DB, or multi-device sync (intentionally out of product scope).
- Expanding USDA coverage beyond existing API + mock fallback behavior.
