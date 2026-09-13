import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_CENTS,
  checkoutRequestSchema,
  priceCart,
  standardShippingCents,
  subtotalOf,
} from "./pricing";

const product = makeProduct({
  slug: "night-owl",
  variants: [
    makeVariant({ id: "250g-whole-bean", priceCents: 1600, stock: 30 }),
    makeVariant({ id: "1kg-espresso", size: "1kg", grind: "espresso", priceCents: 5000, stock: 0 }),
    makeVariant({ id: "1kg-filter", size: "1kg", grind: "filter", priceCents: 5000, stock: 3 }),
  ],
});
const products = new Map([[product.slug, product]]);

const request = (variantId: string, quantity: number, priceCents: number) => ({
  productSlug: "night-owl",
  variantId,
  quantity,
  priceCents,
});

describe("checkoutRequestSchema", () => {
  it("rejects empty carts, oversized quantities and duplicate lines", () => {
    expect(checkoutRequestSchema.safeParse([]).success).toBe(false);
    expect(checkoutRequestSchema.safeParse([request("250g-whole-bean", 11, 1600)]).success).toBe(
      false,
    );
    expect(
      checkoutRequestSchema.safeParse([
        request("250g-whole-bean", 1, 1600),
        request("250g-whole-bean", 2, 1600),
      ]).success,
    ).toBe(false);
  });
});

describe("priceCart", () => {
  it("prices valid lines from the server data without adjustments", () => {
    const { lines, adjustments } = priceCart([request("250g-whole-bean", 2, 1600)], products);
    expect(adjustments).toEqual([]);
    expect(subtotalOf(lines)).toBe(3200);
  });

  it("flags sold out, unknown and inactive items as unavailable", () => {
    const inactive = makeProduct({ slug: "retired", active: false });
    const { lines, adjustments } = priceCart(
      [
        request("1kg-espresso", 1, 5000),
        request("does-not-exist", 1, 100),
        { productSlug: "retired", variantId: "250g-whole-bean", quantity: 1, priceCents: 1800 },
      ],
      new Map([...products, [inactive.slug, inactive]]),
    );
    expect(lines).toEqual([]);
    expect(adjustments.map((adjustment) => adjustment.reason)).toEqual([
      "unavailable",
      "unavailable",
      "unavailable",
    ]);
  });

  it("lowers quantities to what's in stock", () => {
    const { adjustments } = priceCart([request("1kg-filter", 5, 5000)], products);
    expect(adjustments).toEqual([
      {
        key: "night-owl:1kg-filter",
        reason: "quantity",
        quantity: 3,
        maxQuantity: 3,
        priceCents: 5000,
      },
    ]);
  });

  it("ignores the client's price and reports a change", () => {
    const { lines, adjustments } = priceCart([request("250g-whole-bean", 1, 1)], products);
    expect(adjustments[0]).toMatchObject({ reason: "price", priceCents: 1600 });
    expect(subtotalOf(lines)).toBe(1600);
  });
});

describe("standardShippingCents", () => {
  it("is free from the threshold upward", () => {
    expect(standardShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(STANDARD_SHIPPING_CENTS);
    expect(standardShippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
  });
});
