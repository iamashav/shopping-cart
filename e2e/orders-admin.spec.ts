import { expect, test } from "@playwright/test";

test("order lookup validates input without revealing which part was wrong", async ({ page }) => {
  await page.goto("/orders");
  const reference = page.getByLabel("Order reference");
  const email = page.getByLabel("Email used at checkout");
  const submit = page.getByRole("button", { name: "Find my order" });

  await reference.fill("ABC123");
  await email.fill("someone@example.com");
  await submit.click();
  await expect(page.getByText("Order references look like BLM-1A2B3C4D.")).toBeVisible();

  await expect(email).toHaveValue("someone@example.com");

  await reference.fill("BLM-00000000");
  await submit.click();
  await expect(
    page.getByText("We couldn't find an order with that reference and email."),
  ).toBeVisible();
});

test("the admin area redirects signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL("/admin/login");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});
