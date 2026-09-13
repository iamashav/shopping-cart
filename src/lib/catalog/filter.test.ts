import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/fixtures";
import { filterProducts, parseShopQuery, shopHref } from "./filter";

const products = [
  makeProduct({
    slug: "tarrazu-honey",
    name: "Tarrazú Honey",
    origin: "Costa Rica",
    roastLevel: 2,
    tastingNotes: ["Apricot", "Honey"],
    variants: [makeVariant({ priceCents: 2000 })],
  }),
  makeProduct({
    slug: "night-owl",
    name: "Night Owl",
    categorySlug: "blends",
    origin: "Brazil & Sumatra",
    roastLevel: 5,
    featured: true,
    tastingNotes: ["Dark chocolate", "Smoke"],
    variants: [makeVariant({ priceCents: 1600 })],
  }),
  makeProduct({
    slug: "antigua",
    name: "Antigua",
    origin: "Guatemala",
    roastLevel: 3,
    tastingNotes: ["Milk chocolate", "Almond"],
    variants: [makeVariant({ priceCents: 1700 })],
  }),
];

const slugs = (list: typeof products) => list.map((product) => product.slug);

describe("parseShopQuery", () => {
  it("defaults to no filters and featured sort", () => {
    expect(parseShopQuery({})).toEqual({ q: "", category: null, roast: null, sort: "featured" });
  });

  it("ignores unknown roast and sort values", () => {
    expect(parseShopQuery({ roast: "burnt", sort: "random" })).toMatchObject({
      roast: null,
      sort: "featured",
    });
  });

  it("takes the first value of repeated params and trims search", () => {
    expect(parseShopQuery({ q: ["  owl ", "x"], sort: ["price-asc"] })).toMatchObject({
      q: "owl",
      sort: "price-asc",
    });
  });
});

describe("filterProducts", () => {
  const all = parseShopQuery({});

  it("puts featured products first by default", () => {
    expect(slugs(filterProducts(products, all))[0]).toBe("night-owl");
  });

  it("filters by category", () => {
    expect(slugs(filterProducts(products, { ...all, category: "blends" }))).toEqual(["night-owl"]);
  });

  it("filters by roast range", () => {
    expect(slugs(filterProducts(products, { ...all, roast: "light" }))).toEqual(["tarrazu-honey"]);
    expect(slugs(filterProducts(products, { ...all, roast: "dark" }))).toEqual(["night-owl"]);
  });

  it("searches without accents and requires every word", () => {
    expect(slugs(filterProducts(products, { ...all, q: "tarrazu" }))).toEqual(["tarrazu-honey"]);
    expect(slugs(filterProducts(products, { ...all, q: "chocolate milk" }))).toEqual(["antigua"]);
  });

  it("sorts by lowest price", () => {
    expect(slugs(filterProducts(products, { ...all, sort: "price-asc" }))).toEqual([
      "night-owl",
      "antigua",
      "tarrazu-honey",
    ]);
  });
});

describe("shopHref", () => {
  it("omits defaults and encodes the rest", () => {
    const query = parseShopQuery({});
    expect(shopHref(query)).toBe("/shop");
    expect(shopHref(query, { q: "night owl", roast: "dark", sort: "name" })).toBe(
      "/shop?q=night+owl&roast=dark&sort=name",
    );
  });
});
