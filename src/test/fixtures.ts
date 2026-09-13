import type { Product, Variant } from "@/lib/catalog/schema";

export function makeVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: "250g-whole-bean",
    size: "250g",
    grind: "whole-bean",
    priceCents: 1800,
    stock: 20,
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: "test-coffee",
    name: "Test Coffee",
    categorySlug: "single-origin",
    origin: "Colombia",
    region: "Huila",
    process: "Washed",
    roastLevel: 2,
    tastingNotes: ["Cherry", "Cocoa"],
    description: "A coffee for tests.",
    bagColor: "#123456",
    featured: false,
    active: true,
    variants: [makeVariant()],
    ...overrides,
  };
}
