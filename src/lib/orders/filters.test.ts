import { describe, expect, it } from "vitest";
import { matchesOrderFilters, ordersHref, parseOrderFilters } from "./filters";
import type { Order } from "./schema";

const order = (overrides: Partial<Order>): Order => ({
  id: "cs_test_1",
  reference: "BLM-1A2B3C4D",
  status: "paid",
  email: "Ada@Example.com",
  emailLower: "ada@example.com",
  customerName: "Ada Lovelace",
  shipping: null,
  items: [
    {
      productSlug: "night-owl",
      variantId: "250g-whole-bean",
      name: "Night Owl",
      label: "250g · Whole bean",
      quantity: 1,
      unitAmountCents: 1600,
      totalCents: 1600,
      oversold: false,
    },
  ],
  subtotalCents: 1600,
  shippingCents: 500,
  totalCents: 2100,
  currency: "usd",
  paymentIntentId: "pi_1",
  createdAt: new Date("2026-09-13T10:00:00Z"),
  ...overrides,
});

describe("parseOrderFilters", () => {
  it("accepts known statuses and trims the search", () => {
    expect(parseOrderFilters({ status: "shipped", q: "  ada " })).toEqual({
      status: "shipped",
      q: "ada",
    });
  });

  it("ignores unknown statuses", () => {
    expect(parseOrderFilters({ status: "lost" })).toEqual({ status: null, q: "" });
  });
});

describe("matchesOrderFilters", () => {
  it("filters by status", () => {
    expect(matchesOrderFilters(order({}), { status: "shipped", q: "" })).toBe(false);
    expect(matchesOrderFilters(order({ status: "shipped" }), { status: "shipped", q: "" })).toBe(
      true,
    );
  });

  it("searches reference, email and name without caring about case", () => {
    for (const q of ["blm-1a2b", "ADA@example", "lovelace"]) {
      expect(matchesOrderFilters(order({}), { status: null, q })).toBe(true);
    }
    expect(matchesOrderFilters(order({}), { status: null, q: "grace" })).toBe(false);
  });
});

describe("ordersHref", () => {
  it("builds filter URLs and drops empty values", () => {
    const filters = { status: null, q: "" };
    expect(ordersHref(filters)).toBe("/admin/orders");
    expect(ordersHref(filters, { status: "paid", q: "ada lovelace" })).toBe(
      "/admin/orders?status=paid&q=ada+lovelace",
    );
  });
});
