import type { Product } from "./schema";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

export function lowestPriceCents(product: Product): number {
  return Math.min(...product.variants.map((variant) => variant.priceCents));
}

export function isSoldOut(product: Product): boolean {
  return product.variants.every((variant) => variant.stock === 0);
}
