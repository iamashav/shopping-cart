import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { emulatorsRunning, signInAsAdmin } from "./emulator";

// Serious and critical axe violations fail the build; minor/moderate ones are reported in the
// test output so they're visible without blocking unrelated work.
async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const summary = results.violations.map(
    (violation) =>
      `[${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length}) → ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(", ")}`,
  );
  if (summary.length > 0) console.log(`${page.url()}\n  ${summary.join("\n  ")}`);

  const blocking = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
}

const pages = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "filtered shop", path: "/shop?q=tarrazu&category=decaf" },
  { name: "product", path: "/shop/huila-pink" },
  { name: "empty cart", path: "/cart" },
  { name: "order lookup", path: "/orders" },
  { name: "admin sign-in", path: "/admin/login" },
];

for (const { name, path } of pages) {
  test(`${name} page has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoSeriousViolations(page);
  });
}

test("cart with items has no serious accessibility violations", async ({ page }) => {
  await page.goto("/shop/huila-pink");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await expect(page.getByText("Subtotal (1 bag)")).toBeVisible();
  await expectNoSeriousViolations(page);
});

test("keyboard users can skip straight to the content", async ({ page }) => {
  await page.goto("/shop");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await skip.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("unknown pages show the branded 404", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This bag is empty" })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test.describe("admin pages", () => {
  test.skip(!emulatorsRunning(), "Firebase emulators are not running");

  test.beforeEach(async ({ page }, testInfo) => {
    await signInAsAdmin(page, testInfo);
  });

  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/products/night-owl",
    "/admin/products/new",
    "/admin/orders",
  ]) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoSeriousViolations(page);
    });
  }
});
