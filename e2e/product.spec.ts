import { expect, test, type Page } from "@playwright/test";

// Options are visually hidden radios inside pill labels, so click the label like a shopper would.
function option(page: Page, name: string | RegExp) {
  return page.locator("label").filter({ has: page.getByRole("radio", { name }) });
}

test("variant picker updates price and stock", async ({ page }) => {
  await page.goto("/shop/huila-pink");

  await expect(page.getByRole("heading", { name: "Huila Pink" })).toBeVisible();
  await expect(page.getByText("$22.00", { exact: true })).toBeVisible();

  await option(page, "1kg").click();
  await expect(page.getByRole("radio", { name: "1kg" })).toBeChecked();
  await expect(page.getByText("$72.00", { exact: true })).toBeVisible();
  await expect(page.getByText("Only 6 left")).toBeVisible();
});

test("a sold-out option can't be added to the cart", async ({ page }) => {
  await page.goto("/shop/night-owl");

  await option(page, "1kg").click();
  await option(page, /Espresso/).click();
  await expect(page.getByRole("radio", { name: /Espresso/ })).toBeChecked();

  await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();
});

test("unknown products return a 404", async ({ page }) => {
  const response = await page.goto("/shop/not-a-real-coffee");
  expect(response?.status()).toBe(404);
});
