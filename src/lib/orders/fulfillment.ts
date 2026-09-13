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
    let stockTaken = 0;
    if (variants && variant) {
      oversold = variant.stock < line.quantity;
      stockTaken = Math.min(variant.stock, line.quantity);
      variant.stock -= stockTaken;
      updatedVariants.set(line.productSlug, variants);
    }

    items.push({ ...line, oversold, stockTaken });
  }

  return { items, updatedVariants };
}
