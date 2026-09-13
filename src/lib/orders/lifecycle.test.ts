import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import { allowedActions, planRestock, stockToReturn } from "./lifecycle";
import type { OrderItem } from "./schema";

const item = (overrides: Partial<OrderItem>): OrderItem => ({
  productSlug: "night-owl",
  variantId: "250g-whole-bean",
  name: "Night Owl",
  label: "250g · Whole bean",
  quantity: 2,
  unitAmountCents: 1600,
  totalCents: 3200,
  oversold: false,
  ...overrides,
});

describe("allowedActions", () => {
  it("lets only paid orders be shipped or cancelled", () => {
    expect(allowedActions("paid")).toEqual(["ship", "cancel"]);
    expect(allowedActions("shipped")).toEqual([]);
    expect(allowedActions("cancelled")).toEqual([]);
  });
});

describe("stockToReturn", () => {
  it("returns exactly what fulfillment took", () => {
    expect(stockToReturn(item({ quantity: 5, oversold: true, stockTaken: 3 }))).toBe(3);
  });

  it("falls back safely for orders created before stockTaken existed", () => {
    expect(stockToReturn(item({ quantity: 4 }))).toBe(4);
    expect(stockToReturn(item({ quantity: 4, oversold: true }))).toBe(0);
  });
});

describe("planRestock", () => {
  const products = new Map([
    [
      "night-owl",
      makeProduct({
        slug: "night-owl",
        variants: [
          makeVariant({ id: "250g-whole-bean", stock: 10 }),
          makeVariant({ id: "1kg-filter", size: "1kg", grind: "filter", stock: 0 }),
        ],
      }),
    ],
  ]);

  it("adds returned units per variant without mutating the input", () => {
    const updated = planRestock(
      [
        item({ quantity: 2, stockTaken: 2 }),
        item({ variantId: "1kg-filter", quantity: 3, oversold: true, stockTaken: 1 }),
        item({ quantity: 1, stockTaken: 1 }),
      ],
      products,
    );
    expect(updated.get("night-owl")?.map((variant) => variant.stock)).toEqual([13, 1]);
    expect(products.get("night-owl")?.variants.map((variant) => variant.stock)).toEqual([10, 0]);
  });

  it("skips products or variants that no longer exist and items with nothing to return", () => {
    const updated = planRestock(
      [
        item({ productSlug: "retired", stockTaken: 2 }),
        item({ variantId: "gone", stockTaken: 2 }),
        item({ stockTaken: 0 }),
      ],
      products,
    );
    expect(updated.size).toBe(0);
  });
});
