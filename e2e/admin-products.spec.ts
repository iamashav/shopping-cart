import { expect, test, type Page } from "@playwright/test";
import type { Product } from "@/lib/catalog/schema";
import { emulatorsRunning, signInAsAdmin, testDb } from "./emulator";

// These tests write to Firestore, so they only run against the emulators (npm run e2e / CI).
// Each uses a product no other test depends on, so they can run in parallel with the shop tests.
test.skip(!emulatorsRunning(), "Firebase emulators are not running");

test.beforeEach(async ({ page }, testInfo) => {
  await signInAsAdmin(page, testInfo);
});

test("editing a product updates the shop immediately", async ({ page }) => {
  await page.goto("/admin/products");
  await page.getByRole("link", { name: "Edit Morning Bloom" }).click();
  await expect(page.getByRole("heading", { name: "Morning Bloom" })).toBeVisible();

  await page.getByLabel("Price for 250g Whole bean").fill("14.00");
  await page.getByLabel("Tasting notes").fill("Stone fruit, Citrus, Honey");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Morning Bloom saved")).toBeVisible();

  await page.goto("/shop/morning-bloom");
  await expect(page.getByText("$14.00", { exact: true })).toBeVisible();
  await expect(page.getByText("Honey", { exact: true })).toBeVisible();
});

test("invalid input shows errors and keeps what was typed", async ({ page }) => {
  await page.goto("/admin/products/sugarcane-decaf");

  const price = page.getByLabel("Price for 1kg Filter");
  await price.fill("abc");
  await page.getByLabel("Name").fill("Sugarcane Decaf Special");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Enter a price like 18.50.")).toBeVisible();
  await expect(price).toHaveAttribute("aria-invalid", "true");
  await expect(price).toHaveAccessibleDescription("Enter a price like 18.50.");
  await expect(price).toHaveValue("abc");
  await expect(page.getByLabel("Name")).toHaveValue("Sugarcane Decaf Special");

  const stored = (await testDb().collection("products").doc("sugarcane-decaf").get()).data();
  expect(stored?.name).toBe("Sugarcane Decaf");
});

test("saving is blocked when an order changed stock in the meantime", async ({ page }) => {
  const ref = testDb().collection("products").doc("nyeri-aa");
  const product = (await ref.get()).data() as Product;
  const stockOf = (p: Product, id: string) =>
    p.variants.find((variant) => variant.id === id)!.stock;
  const wholeBeanBefore = stockOf(product, "250g-whole-bean");
  const filterBefore = stockOf(product, "1kg-filter");

  await page.goto("/admin/products/nyeri-aa");
  await expect(page.getByLabel("Stock for 250g Whole bean")).toHaveValue(String(wholeBeanBefore));

  // Simulate a paid order decrementing stock while the form is open.
  await ref.update({
    variants: product.variants.map((variant) =>
      variant.id === "250g-whole-bean" ? { ...variant, stock: variant.stock - 1 } : variant,
    ),
  });

  await page.getByLabel("Stock for 1kg Filter").fill(String(filterBefore + 15));
  await page.getByRole("button", { name: "Save changes" }).click();

  // Next.js renders its own empty role="alert" route announcer, so match ours by its text.
  await expect(
    page.getByRole("alert").filter({ hasText: "Stock changed since you opened this page" }),
  ).toBeVisible();
  const stored = (await ref.get()).data() as Product;
  expect(stockOf(stored, "1kg-filter")).toBe(filterBefore);
  expect(stockOf(stored, "250g-whole-bean")).toBe(wholeBeanBefore - 1);
});

async function fillNewProduct(page: Page, name: string) {
  await page.goto("/admin/products/new");
  await expect(page.getByRole("heading", { name: "New product" })).toBeVisible();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Category").selectOption("single-origin");
  await page.getByLabel("Origin").fill("Peru");
  await page.getByLabel("Region").fill("Cajamarca");
  await page.getByLabel("Process").fill("Washed");
  await page.getByLabel("Roast level").selectOption("1");
  await page.getByLabel("Tasting notes").fill("Toffee, Fig");
  await page.getByLabel("Description").fill("A test coffee created by the e2e suite.");
  for (const grind of ["Whole bean", "Filter", "Espresso"]) {
    await page.getByLabel(`Price for 250g ${grind}`).fill("16.50");
    await page.getByLabel(`Price for 1kg ${grind}`).fill("52");
    await page.getByLabel(`Stock for 250g ${grind}`).fill("7");
  }
}

test("creating a product publishes it to the shop", async ({ page }, testInfo) => {
  // Retries reuse the emulator, so give each attempt its own product.
  const name = `E2E Harvest ${testInfo.retry}`;
  const slug = `e2e-harvest-${testInfo.retry}`;

  await page.goto("/admin/products");
  await page.getByRole("link", { name: "New product" }).click();
  await fillNewProduct(page, name);
  await expect(page.getByLabel("URL")).toHaveValue(slug);
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page).toHaveURL(`/admin/products/${slug}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.goto(`/shop/${slug}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("$16.50", { exact: true })).toBeVisible();
  await expect(page.getByText("Only 7 left")).toBeVisible();
});

test("a product URL can't be taken twice", async ({ page }) => {
  await fillNewProduct(page, "Night Owl");
  await expect(page.getByLabel("URL")).toHaveValue("night-owl");
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page.getByText("A product with this URL already exists.")).toBeVisible();
  await expect(page.getByLabel("Origin")).toHaveValue("Peru");
  const stored = (await testDb().collection("products").doc("night-owl").get()).data();
  expect(stored?.origin).toBe("Brazil & Sumatra");
});
