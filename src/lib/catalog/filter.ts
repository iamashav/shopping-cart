import { lowestPriceCents } from "./pricing";
import type { Product } from "./schema";

export const SORT_OPTIONS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
} as const;

export const ROAST_RANGES = {
  light: { label: "Light", min: 1, max: 2 },
  medium: { label: "Medium", min: 3, max: 3 },
  dark: { label: "Dark", min: 4, max: 5 },
} as const;

export type Sort = keyof typeof SORT_OPTIONS;
export type Roast = keyof typeof ROAST_RANGES;

export type ShopQuery = {
  q: string;
  category: string | null;
  roast: Roast | null;
  sort: Sort;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isKey<T extends object>(
  object: T,
  key: string | undefined,
): key is Extract<keyof T, string> {
  return key !== undefined && Object.hasOwn(object, key);
}

export function parseShopQuery(params: SearchParams): ShopQuery {
  const roast = first(params.roast);
  const sort = first(params.sort);
  return {
    q: first(params.q)?.trim() ?? "",
    category: first(params.category) || null,
    roast: isKey(ROAST_RANGES, roast) ? roast : null,
    sort: isKey(SORT_OPTIONS, sort) ? sort : "featured",
  };
}

export function shopHref(query: ShopQuery, patch: Partial<ShopQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.roast) params.set("roast", next.roast);
  if (next.sort !== "featured") params.set("sort", next.sort);
  const search = params.toString();
  return search ? `/shop?${search}` : "/shop";
}

// Strip accents so "tarrazu" finds "Tarrazú".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesSearch(product: Product, q: string): boolean {
  const haystack = normalize(
    [product.name, product.origin, product.region, product.process, ...product.tastingNotes].join(
      " ",
    ),
  );
  return normalize(q)
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

const SORTERS: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
  "price-asc": (a, b) => lowestPriceCents(a) - lowestPriceCents(b),
  "price-desc": (a, b) => lowestPriceCents(b) - lowestPriceCents(a),
  name: (a, b) => a.name.localeCompare(b.name),
};

export function filterProducts(products: Product[], query: ShopQuery): Product[] {
  const range = query.roast ? ROAST_RANGES[query.roast] : null;
  return products
    .filter((product) => !query.category || product.categorySlug === query.category)
    .filter(
      (product) => !range || (product.roastLevel >= range.min && product.roastLevel <= range.max),
    )
    .filter((product) => !query.q || matchesSearch(product, query.q))
    .sort(SORTERS[query.sort]);
}
