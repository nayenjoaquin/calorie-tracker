const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BASE = "http://127.0.0.1:43147";
const OUT = "/tmp/platewise-mobile-demo";
const ART = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

try {
  require.resolve("playwright");
} catch {
  execSync("npm install -D playwright", { cwd: "/workspace", stdio: "inherit" });
}

async function main() {
  const { chromium: cr } = require("playwright");
  const browser = await cr.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(ART, "mobile_diary_empty.png"), fullPage: true });

  await page.goto(`${BASE}/foods`, { waitUntil: "networkidle" });
  await page.locator("ul li button").first().waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ART, "mobile_foods.png"), fullPage: true });
  await page.locator("ul li button").first().click();
  await page.getByRole("button", { name: /Add to diary/i }).waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ART, "mobile_food_modal.png") });
  await page.getByRole("button", { name: /Add to diary/i }).click();
  await page.waitForTimeout(500);

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ART, "mobile_diary_logged.png"), fullPage: true });

  await page.goto(`${BASE}/recipes`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /New/i }).click();
  await page.getByLabel(/^Name$/i).fill("Test Bowl");
  await page.getByRole("button", { name: /Ingredient/i }).click();
  await page.waitForTimeout(500);
  const sheetFood = page.locator("[data-slot='sheet-content'] ul li button").first();
  if (await sheetFood.count()) await sheetFood.click();
  else await page.locator("ul li button").nth(1).click();
  await page.getByRole("button", { name: /Add to recipe/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Save recipe/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ART, "mobile_recipes.png"), fullPage: true });

  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  await page.getByLabel(/Weight \(kg\)/i).fill("74.5");
  await page.getByLabel(/^Note$/i).fill("morning");
  await page.getByRole("button", { name: /Save weigh-in/i }).click();
  await page.waitForTimeout(500);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await page.locator("#w-date").fill(yesterday.toISOString().slice(0, 10));
  await page.getByLabel(/Weight \(kg\)/i).fill("75.0");
  await page.getByRole("button", { name: /Save weigh-in/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ART, "mobile_progress.png"), fullPage: true });

  // bottom nav check
  await page.getByRole("link", { name: "Diary" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(ART, "mobile_nav_diary.png"), fullPage: true });

  await context.close();
  await browser.close();

  const videos = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
  const webm = path.join(OUT, videos[0]);
  execSync(
    `ffmpeg -y -i "${webm}" -c:v libx264 -pix_fmt yuv420p "${path.join(ART, "mobile_redesign_demo.mp4")}"`,
    { stdio: "inherit" },
  );
  console.log("done", fs.readdirSync(ART).filter((f) => f.startsWith("mobile_")));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
