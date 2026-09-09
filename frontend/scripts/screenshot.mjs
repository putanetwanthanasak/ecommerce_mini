// One-off: capture README screenshots from the LIVE deployment.
//
// Not part of the app build (frontend/tsconfig only compiles src/). Run with:
//   node scripts/screenshot.mjs
// Needs `playwright` (devDependency) + `npx playwright install chromium`.
//
// It registers a throwaway account on the live site and places one qty-1 order,
// because every content route is behind ProtectedRoute and there is no shared
// demo login. Emits PNGs into ../docs/screenshots/.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SPA = "https://ecommerce-mini-lyart.vercel.app";
const API = "https://ecommerce-backend-7u06.onrender.com";
const OUT_DIR = fileURLToPath(new URL("../../docs/screenshots/", import.meta.url));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hit the API directly and wait out Render's cold start before driving the UI,
// so the catalog never screenshots mid-spinner.
async function warmApi() {
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      const health = await fetch(`${API}/health`, { signal: AbortSignal.timeout(60_000) });
      if (health.ok) {
        const res = await fetch(`${API}/api/products?limit=50`, {
          signal: AbortSignal.timeout(60_000),
        });
        const body = await res.json();
        if (res.ok && Array.isArray(body.products) && body.products.length > 0) {
          console.log(`API warm after ${attempt} attempt(s): ${body.products.length} products`);
          return body.products;
        }
      }
    } catch {
      /* cold start / transient — retry */
    }
    console.log(`  warming API, attempt ${attempt}...`);
    await sleep(3000);
  }
  throw new Error("API did not return products within ~75s");
}

// Wait for the DOM to settle AND for every <img> to have actually decoded, so
// product photography isn't caught half-painted.
async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page
    .waitForFunction(
      () => {
        const imgs = [...document.querySelectorAll("img")];
        return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
      },
      { timeout: 20_000 }
    )
    .catch(() => console.log("  (proceeding; not all images reported decoded)"));
  await sleep(600); // let any enter transition finish
}

async function shot(page, name) {
  const path = `${OUT_DIR}${name}`;
  await page.screenshot({ path });
  console.log(`  saved ${name}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const products = await warmApi();
  const target =
    products.find((p) => p.stock > 5 && p.imageUrl) ?? products.find((p) => p.stock > 0);
  console.log(`Ordering: ${target.name} (stock ${target.stock}) x1`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const email = `limina-readme-demo+${Date.now()}@example.com`;
  const password = "limina-demo-2026";
  console.log(`Registering ${email}`);

  await page.goto(`${SPA}/register`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Name").fill("Demo Reviewer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/products", { timeout: 30_000 });
  await settle(page);

  // 1 — catalog: in-stock, low-stock and sold-out states all visible at once
  await shot(page, "01-catalog.png");

  // 2 — product detail (the ordered product, so its image is the banner)
  await page.getByRole("link", { name: new RegExp(target.name, "i") }).first().click();
  await page.waitForURL("**/products/**");
  await settle(page);
  await shot(page, "02-product-detail.png");

  // 3 — cart with one item
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.goto(`${SPA}/cart`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "03-cart.png");

  // 4 — checkout: the cosmetic shipping + payment form and the order summary
  await page.getByRole("link", { name: /^checkout$/i }).first().click();
  await page.waitForURL("**/checkout");
  await settle(page);
  await shot(page, "04-checkout.png");

  // 5 — order confirmation / detail, with the real product thumbnail on the line
  await page.getByRole("button", { name: /place order/i }).click();
  await page.waitForURL(/\/orders\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await settle(page);
  await shot(page, "05-order-detail.png");

  await browser.close();
  console.log(`\nDone. Demo account: ${email}  (order placed: ${target.name} x1)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
