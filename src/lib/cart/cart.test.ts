import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import {
  MAX_QUANTITY_PER_LINE,
  addLine,
  removeLine,
  setLineQuantity,
  subtotalCents,
  toCartLine,
  totalItems,
} from "./cart";

const product = makeProduct();
const small = makeVariant({ id: "250g-filter", grind: "filter", priceCents: 1800, stock: 20 });
const large = makeVariant({ id: "1kg-filter", size: "1kg", grind: "filter", priceCents: 5800 });

describe("toCartLine", () => {
  it("caps quantity at the per-line limit", () => {
    expect(toCartLine(product, small, 50).quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("caps quantity at available stock", () => {
    const line = toCartLine(product, makeVariant({ stock: 3 }), 5);
    expect(line.maxQuantity).toBe(3);
    expect(line.quantity).toBe(3);
  });
});

describe("addLine", () => {
  it("adds a new line", () => {
    const lines = addLine([], toCartLine(product, small, 2));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ key: "test-coffee:250g-filter", quantity: 2 });
  });

  it("merges quantities for the same variant", () => {
    let lines = addLine([], toCartLine(product, small, 2));
    lines = addLine(lines, toCartLine(product, small, 3));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(5);
  });

  it("keeps different variants of one product as separate lines", () => {
    let lines = addLine([], toCartLine(product, small, 1));
    lines = addLine(lines, toCartLine(product, large, 1));
    expect(lines.map((line) => line.variantId)).toEqual(["250g-filter", "1kg-filter"]);
  });

  it("never merges past the maximum", () => {
    let lines = addLine([], toCartLine(product, small, 8));
    lines = addLine(lines, toCartLine(product, small, 8));
    expect(lines[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("ignores lines with nothing to add", () => {
    expect(addLine([], toCartLine(product, makeVariant({ stock: 0 }), 1))).toEqual([]);
  });
});

describe("setLineQuantity and removeLine", () => {
  const lines = addLine(addLine([], toCartLine(product, small, 2)), toCartLine(product, large, 1));

  it("updates one line's quantity", () => {
    expect(setLineQuantity(lines, "test-coffee:1kg-filter", 4)[1].quantity).toBe(4);
  });

  it("drops a line set to zero", () => {
    expect(setLineQuantity(lines, "test-coffee:250g-filter", 0)).toHaveLength(1);
  });

  it("removes a line", () => {
    expect(removeLine(lines, "test-coffee:250g-filter").map((line) => line.key)).toEqual([
      "test-coffee:1kg-filter",
    ]);
  });
});

describe("totals", () => {
  it("counts items and sums prices", () => {
    const lines = addLine(
      addLine([], toCartLine(product, small, 2)),
      toCartLine(product, large, 1),
    );
    expect(totalItems(lines)).toBe(3);
    expect(subtotalCents(lines)).toBe(2 * 1800 + 5800);
  });
});
