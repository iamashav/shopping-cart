import type { Product, Variant } from "@/lib/catalog/schema";

export const MAX_QUANTITY_PER_LINE = 10;

// Prices here are for display only; checkout re-prices every line from Firestore.
export type CartLine = {
  key: string;
  productSlug: string;
  variantId: string;
  name: string;
  origin: string;
  roastLevel: number;
  bagColor: string;
  size: Variant["size"];
  grind: Variant["grind"];
  priceCents: number;
  maxQuantity: number;
  quantity: number;
};

export function lineKey(productSlug: string, variantId: string): string {
  return `${productSlug}:${variantId}`;
}

export function toCartLine(product: Product, variant: Variant, quantity: number): CartLine {
  const maxQuantity = Math.min(variant.stock, MAX_QUANTITY_PER_LINE);
  return {
    key: lineKey(product.slug, variant.id),
    productSlug: product.slug,
    variantId: variant.id,
    name: product.name,
    origin: product.origin,
    roastLevel: product.roastLevel,
    bagColor: product.bagColor,
    size: variant.size,
    grind: variant.grind,
    priceCents: variant.priceCents,
    maxQuantity,
    quantity: clampQuantity(quantity, maxQuantity),
  };
}

function clampQuantity(quantity: number, max: number): number {
  return Math.max(0, Math.min(Math.floor(quantity), max));
}

export function addLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const existing = lines.find((line) => line.key === incoming.key);
  if (!existing) return incoming.quantity > 0 ? [...lines, incoming] : lines;

  return lines.map((line) =>
    line.key === incoming.key
      ? {
          ...incoming,
          quantity: clampQuantity(line.quantity + incoming.quantity, incoming.maxQuantity),
        }
      : line,
  );
}

export function setLineQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  return lines
    .map((line) =>
      line.key === key ? { ...line, quantity: clampQuantity(quantity, line.maxQuantity) } : line,
    )
    .filter((line) => line.quantity > 0);
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((line) => line.key !== key);
}

export function totalItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
}
