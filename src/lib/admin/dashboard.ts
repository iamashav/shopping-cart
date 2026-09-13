import "server-only";
import { AggregateField } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth/session";
import { productSchema } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";
import { parseOrder } from "@/lib/orders/queries";

export const LOW_STOCK_THRESHOLD = 5;

export async function getDashboard() {
  // Layout checks don't cover data access, so every admin query verifies the session itself.
  await requireAdmin();

  const [totals, recent, products] = await Promise.all([
    db
      .collection("orders")
      .aggregate({ count: AggregateField.count(), revenue: AggregateField.sum("totalCents") })
      .get(),
    db.collection("orders").orderBy("createdAt", "desc").limit(5).get(),
    db.collection("products").get(),
  ]);

  const lowStock = products.docs
    .map((doc) => productSchema.safeParse(doc.data()))
    .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
    .flatMap((product) =>
      product.variants
        .filter((variant) => variant.stock <= LOW_STOCK_THRESHOLD)
        .map((variant) => ({ product: product.name, variant, slug: product.slug })),
    )
    .sort((a, b) => a.variant.stock - b.variant.stock);

  return {
    orderCount: totals.data().count,
    revenueCents: totals.data().revenue ?? 0,
    recentOrders: recent.docs.flatMap((doc) => parseOrder(doc.data()) ?? []),
    lowStock,
  };
}
