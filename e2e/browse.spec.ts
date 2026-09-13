import { expect, test } from "@playwright/test";

test("home page shows the brand and this week's roasts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Coffee worth slowing down for." })).toBeVisible();
  const featured = page.locator("section", {
    has: page.getByRole("heading", { name: "This week's roasts" }),
  });
  await expect(featured.getByRole("link", { name: /Huila Pink/ })).toBeVisible();
  await expect(featured.locator("a[href^='/shop/']")).toHaveCount(4);

  await page.getByRole("link", { name: "Shop coffee" }).click();
  await expect(page).toHaveURL("/shop");
});

test("search, category filters and clearing them", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByText("10 coffees")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Gayo Highlands/ }).getByText("Sold out"),
  ).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search coffee" });
  await search.fill("tarrazu");
  await expect(page).toHaveURL(/q=tarrazu/);
  await expect(page.getByText("1 coffee", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tarrazú Honey/ })).toBeVisible();

  await page.getByRole("link", { name: "Decaf", exact: true }).click();
  await expect(page).toHaveURL(/category=decaf/);
  await expect(page.getByText("No coffee matches those filters")).toBeVisible();

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL("/shop");
  await expect(page.getByText("10 coffees")).toBeVisible();
  await expect(search).toHaveValue("");
});

test("roast filter and price sort work from a shared URL", async ({ page }) => {
  await page.goto("/shop?roast=medium&sort=price-desc");

  await expect(page.getByRole("combobox")).toHaveValue("price-desc");
  await expect(page.locator("main h3")).toHaveText(["Sugarcane Decaf", "Antigua", "Sunday Blend"]);
});
