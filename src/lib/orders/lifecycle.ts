import type { Product, Variant } from "@/lib/catalog/schema";
import type { OrderItem, OrderStatus } from "./schema";

export type OrderAction = "ship" | "cancel";

// Only paid orders can move on. A shipped order is already with the customer, so undoing it is a
// return, not a cancellation.
export function allowedActions(status: OrderStatus): OrderAction[] {
  return status === "paid" ? ["ship", "cancel"] : [];
}

export function stockToReturn(item: OrderItem): number {
  // Older orders didn't record stockTaken; an oversold item may have taken less than its
  // quantity, so returning nothing is the only estimate that can't inflate stock.
  return item.stockTaken ?? (item.oversold ? 0 : item.quantity);
}

export function planRestock(
  items: OrderItem[],
  products: Map<string, Product>,
): Map<string, Variant[]> {
  const updatedVariants = new Map<string, Variant[]>();

  for (const item of items) {
    const amount = stockToReturn(item);
    if (amount === 0) continue;

    const variants =
      updatedVariants.get(item.productSlug) ??
      products.get(item.productSlug)?.variants.map((variant) => ({ ...variant }));
    const variant = variants?.find((candidate) => candidate.id === item.variantId);
    if (!variants || !variant) continue;

    variant.stock += amount;
    updatedVariants.set(item.productSlug, variants);
  }

  return updatedVariants;
}
