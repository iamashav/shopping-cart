import { expect, test, type Page } from "@playwright/test";

async function addHuilaPink(page: Page, quantity: number) {
  await page.goto("/shop/huila-pink");
  for (let i = 1; i < quantity; i++) {
    await page.getByRole("button", { name: "Increase quantity" }).click();
  }
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Huila Pink added to your cart")).toBeVisible();
}

test("add to cart, change quantity, persist and remove", async ({ page }) => {
  await addHuilaPink(page, 2);
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

  await page.getByRole("link", { name: "Cart, 2 items" }).click();
  await expect(page.getByText("Subtotal (2 bags)")).toBeVisible();
  await expect(page.getByRole("complementary").getByText("$44.00")).toBeVisible();

  await page
    .getByRole("group", { name: "Quantity of Huila Pink" })
    .getByRole("button", { name: "Increase quantity" })
    .click();
  await expect(page.getByRole("complementary").getByText("$66.00")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Subtotal (3 bags)")).toBeVisible();

  await page.getByRole("button", { name: "Remove Huila Pink from cart" }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 0 items" })).toBeVisible();
});

test("checkout corrects a tampered cart before paying", async ({ page }) => {
  await page.goto("/cart");
  await page.evaluate(() => {
    const line = {
      key: "huila-pink:250g-whole-bean",
      productSlug: "huila-pink",
      variantId: "250g-whole-bean",
      name: "Huila Pink",
      origin: "Colombia",
      roastLevel: 2,
      bagColor: "#d98b73",
      size: "250g",
      grind: "whole-bean",
      priceCents: 1,
      maxQuantity: 10,
      quantity: 1,
    };
    localStorage.setItem("bloom-cart", JSON.stringify({ version: 1, state: { lines: [line] } }));
  });
  await page.reload();
  await expect(page.getByText("$0.01 each")).toBeVisible();

  await page.getByRole("button", { name: "Checkout" }).click();

  await expect(page.getByText("Your cart was updated")).toBeVisible();
  await expect(page.getByText("$22.00 each")).toBeVisible();
  await expect(page).toHaveURL("/cart");
});

test("checkout sends the customer to Stripe", async ({ page }) => {
  test.skip(!process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is not set");

  await addHuilaPink(page, 1);
  await page.goto("/cart");
  await page.getByRole("button", { name: "Checkout" }).click();

  await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: 30_000 });
  await expect(page.getByText("Bloom").first()).toBeVisible({ timeout: 30_000 });
});
