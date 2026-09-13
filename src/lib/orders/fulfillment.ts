import type { Product, Variant } from "@/lib/catalog/schema";
import type { OrderItem } from "./schema";

export type PaidLine = {
  productSlug: string;
  variantId: string;
  name: string;
  label: string;
  quantity: number;
  unitAmountCents: number;
  totalCents: number;
};

export type FulfillmentPlan = {
  items: OrderItem[];
  updatedVariants: Map<string, Variant[]>;
};

// Payment already succeeded, so every paid line becomes an order item even if stock ran out
// in the meantime; those are flagged as oversold instead of being dropped.
export function planFulfillment(
  lines: PaidLine[],
  products: Map<string, Product>,
): FulfillmentPlan {
  const updatedVariants = new Map<string, Variant[]>();
  const items: OrderItem[] = [];

  for (const line of lines) {
    const variants =
      updatedVariants.get(line.productSlug) ??
      products.get(line.productSlug)?.variants.map((variant) => ({ ...variant }));
    const variant = variants?.find((candidate) => candidate.id === line.variantId);

    let oversold = true;
    if (variants && variant) {
      oversold = variant.stock < line.quantity;
      variant.stock = Math.max(0, variant.stock - line.quantity);
      updatedVariants.set(line.productSlug, variants);
    }

    items.push({ ...line, oversold });
  }

  return { items, updatedVariants };
}
