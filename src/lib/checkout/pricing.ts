import { z } from "zod";
import { MAX_QUANTITY_PER_LINE, lineKey } from "@/lib/cart/cart";
import type { Product, Variant } from "@/lib/catalog/schema";

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
export const STANDARD_SHIPPING_CENTS = 500;
export const EXPRESS_SHIPPING_CENTS = 1500;
const MAX_LINES = 30;

export const checkoutRequestSchema = z
  .array(
    z.object({
      productSlug: z.string().min(1).max(100),
      variantId: z.string().min(1).max(50),
      quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      priceCents: z.number().int().nonnegative(),
    }),
  )
  .min(1)
  .max(MAX_LINES)
  .refine(
    (lines) =>
      new Set(lines.map((line) => lineKey(line.productSlug, line.variantId))).size === lines.length,
    "Duplicate cart lines",
  );

export type CheckoutRequestLine = z.infer<typeof checkoutRequestSchema>[number];

export type PricedLine = {
  product: Product;
  variant: Variant;
  quantity: number;
};

export type Adjustment = {
  key: string;
  reason: "unavailable" | "quantity" | "price";
  quantity: number;
  maxQuantity: number;
  priceCents: number;
};

export function priceCart(
  requested: CheckoutRequestLine[],
  products: Map<string, Product>,
): { lines: PricedLine[]; adjustments: Adjustment[] } {
  const lines: PricedLine[] = [];
  const adjustments: Adjustment[] = [];

  for (const request of requested) {
    const key = lineKey(request.productSlug, request.variantId);
    const product = products.get(request.productSlug);
    const variant = product?.active
      ? product.variants.find((candidate) => candidate.id === request.variantId)
      : undefined;

    if (!product || !variant || variant.stock === 0) {
      adjustments.push({ key, reason: "unavailable", quantity: 0, maxQuantity: 0, priceCents: 0 });
      continue;
    }

    const maxQuantity = Math.min(variant.stock, MAX_QUANTITY_PER_LINE);
    const quantity = Math.min(request.quantity, maxQuantity);

    if (quantity < request.quantity) {
      adjustments.push({
        key,
        reason: "quantity",
        quantity,
        maxQuantity,
        priceCents: variant.priceCents,
      });
    } else if (variant.priceCents !== request.priceCents) {
      adjustments.push({
        key,
        reason: "price",
        quantity,
        maxQuantity,
        priceCents: variant.priceCents,
      });
    }

    lines.push({ product, variant, quantity });
  }

  return { lines, adjustments };
}

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.variant.priceCents * line.quantity, 0);
}

export function standardShippingCents(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
}
