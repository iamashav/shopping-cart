import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import {
  ALL_VARIANT_SHAPES,
  LOADED_STOCK_FIELD,
  emptyProductValues,
  parseNewProductForm,
  parseProductForm,
  priceField,
  productToValues,
  slugify,
  stockConflicts,
  stockField,
  type FormValues,
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

describe("slugify", () => {
  it("makes URL-safe names without accents or stray hyphens", () => {
    expect(slugify("Tarrazú Honey")).toBe("tarrazu-honey");
    expect(slugify("  Brazil & Ethiopia -- Blend! ")).toBe("brazil-and-ethiopia-blend");
    expect(slugify("Ñandú  #2")).toBe("nandu-2");
  });
});

describe("parseNewProductForm", () => {
  const filled = () => {
    const values: FormValues = {
      ...emptyProductValues("blends"),
      name: "Autumn Ember",
      slug: "autumn-ember",
      origin: "Peru",
      region: "Cajamarca",
      process: "Washed",
      roastLevel: "4",
      tastingNotes: "Toffee, Fig",
      description: "A cosy seasonal blend.",
    };
    for (const shape of ALL_VARIANT_SHAPES) {
      values[priceField(shape.id)] = shape.size === "1kg" ? "52" : "16.5";
      values[stockField(shape.id)] = "12";
    }
    return values;
  };

  it("builds every size and grind variant with derived ids", () => {
    const result = parseNewProductForm(filled(), categories);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.slug).toBe("autumn-ember");
    expect(result.product.variants).toHaveLength(6);
    expect(result.product.variants[0]).toEqual({
      id: "250g-whole-bean",
      size: "250g",
      grind: "whole-bean",
      priceCents: 1650,
      stock: 12,
    });
    expect(result.product.active).toBe(true);
    expect(result.product.featured).toBe(false);
  });

  it("requires a valid, non-reserved slug and prices for every variant", () => {
    const bad = { ...filled(), slug: "Autumn Ember!" };
    expect(parseNewProductForm(bad, categories)).toMatchObject({
      ok: false,
      fieldErrors: { slug: expect.stringContaining("lowercase") },
    });

    expect(parseNewProductForm({ ...filled(), slug: "new" }, categories)).toMatchObject({
      ok: false,
      fieldErrors: { slug: expect.stringContaining("reserved") },
    });

    const missingPrice = { ...filled(), [priceField("1kg-espresso")]: "" };
    expect(parseNewProductForm(missingPrice, categories)).toMatchObject({
      ok: false,
      fieldErrors: { [priceField("1kg-espresso")]: expect.any(String) },
    });
  });
});
