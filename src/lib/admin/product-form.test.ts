import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import {
  LOADED_STOCK_FIELD,
  parseProductForm,
  priceField,
  productToValues,
  stockConflicts,
  stockField,
} from "./product-form";

const current = makeProduct({
  slug: "night-owl",
  variants: [
    makeVariant({ id: "250g-whole-bean", priceCents: 1600, stock: 30 }),
    makeVariant({ id: "1kg-espresso", size: "1kg", grind: "espresso", priceCents: 5000, stock: 0 }),
  ],
});
const categories = new Set(["single-origin", "blends"]);

describe("parseProductForm", () => {
  it("round-trips the stored product unchanged", () => {
    const result = parseProductForm(productToValues(current), current, categories);
    expect(result).toEqual({
      ok: true,
      product: current,
      loadedStock: { "250g-whole-bean": 30, "1kg-espresso": 0 },
    });
  });

  it("applies edits, converts dollars to cents and splits tasting notes", () => {
    const values = {
      ...productToValues(current),
      name: "  Night Owl Reserve ",
      categorySlug: "blends",
      tastingNotes: "Dark chocolate, , Molasses ,Smoke",
      featured: "on",
      active: "",
      [priceField("250g-whole-bean")]: "17.5",
      [stockField("1kg-espresso")]: "12",
    };
    const result = parseProductForm(values, current, categories);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product).toMatchObject({
      slug: "night-owl",
      name: "Night Owl Reserve",
      categorySlug: "blends",
      tastingNotes: ["Dark chocolate", "Molasses", "Smoke"],
      featured: true,
      active: false,
    });
    expect(result.product.variants.map((v) => [v.id, v.priceCents, v.stock])).toEqual([
      ["250g-whole-bean", 1750, 30],
      ["1kg-espresso", 5000, 12],
    ]);
  });

  it("reports field errors instead of saving invalid input", () => {
    const values = {
      ...productToValues(current),
      name: "",
      categorySlug: "made-up",
      bagColor: "red",
      tastingNotes: " , ",
      [priceField("250g-whole-bean")]: "0",
      [stockField("1kg-espresso")]: "-3",
    };
    const result = parseProductForm(values, current, categories);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(
      [
        "name",
        "categorySlug",
        "bagColor",
        "tastingNotes",
        priceField("250g-whole-bean"),
        stockField("1kg-espresso"),
      ].sort(),
    );
  });

  it("never lets the form change the slug or variant structure", () => {
    const values = { ...productToValues(current), slug: "hijacked", "price:extra-variant": "1.00" };
    const result = parseProductForm(values, current, categories);
    expect(result.ok && result.product.slug).toBe("night-owl");
    expect(result.ok && result.product.variants.map((v) => v.id)).toEqual([
      "250g-whole-bean",
      "1kg-espresso",
    ]);
  });

  it("rejects a missing or tampered stock snapshot", () => {
    const values = { ...productToValues(current), [LOADED_STOCK_FIELD]: "not json" };
    const result = parseProductForm(values, current, categories);
    expect(result.ok).toBe(false);
  });
});

describe("stockConflicts", () => {
  it("lists variants whose stock changed since the form loaded", () => {
    const afterOrder = makeProduct({
      variants: [
        makeVariant({ id: "250g-whole-bean", stock: 28 }),
        makeVariant({ id: "1kg-espresso", stock: 0 }),
      ],
    });
    expect(stockConflicts({ "250g-whole-bean": 30, "1kg-espresso": 0 }, afterOrder)).toEqual([
      "250g-whole-bean",
    ]);
  });
});
