import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import { planFulfillment, type PaidLine } from "./fulfillment";
import { ORDER_REFERENCE_PATTERN, orderReference } from "./reference";

const product = makeProduct({
  slug: "night-owl",
  variants: [
    makeVariant({ id: "250g-whole-bean", stock: 30 }),
    makeVariant({ id: "1kg-filter", size: "1kg", grind: "filter", stock: 2 }),
  ],
});
const products = new Map([[product.slug, product]]);

const line = (variantId: string, quantity: number, productSlug = "night-owl"): PaidLine => ({
  productSlug,
  variantId,
  name: "Night Owl",
  label: variantId,
  quantity,
  unitAmountCents: 1600,
  totalCents: 1600 * quantity,
});

describe("planFulfillment", () => {
  it("decrements stock for each paid line without mutating the input", () => {
    const { items, updatedVariants } = planFulfillment(
      [line("250g-whole-bean", 3), line("1kg-filter", 2)],
      products,
    );
    expect(items.every((item) => !item.oversold)).toBe(true);
    expect(updatedVariants.get("night-owl")?.map((variant) => variant.stock)).toEqual([27, 0]);
    expect(product.variants.map((variant) => variant.stock)).toEqual([30, 2]);
  });

  it("flags oversold lines and never goes below zero", () => {
    const { items, updatedVariants } = planFulfillment([line("1kg-filter", 5)], products);
    expect(items[0].oversold).toBe(true);
    expect(updatedVariants.get("night-owl")?.[1].stock).toBe(0);
  });

  it("keeps paid lines for products that no longer exist", () => {
    const { items, updatedVariants } = planFulfillment(
      [line("250g-whole-bean", 1, "gone")],
      products,
    );
    expect(items).toHaveLength(1);
    expect(items[0].oversold).toBe(true);
    expect(updatedVariants.size).toBe(0);
  });
});

describe("orderReference", () => {
  it("is stable for a session and looks like a Bloom reference", () => {
    const reference = orderReference("cs_test_abc123");
    expect(reference).toBe(orderReference("cs_test_abc123"));
    expect(reference).not.toBe(orderReference("cs_test_abc124"));
    expect(reference).toMatch(ORDER_REFERENCE_PATTERN);
  });
});
