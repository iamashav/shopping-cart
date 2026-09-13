import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/firebase/admin";
import { matchesOrderFilters, type OrderFilters } from "@/lib/orders/filters";
import { parseOrder } from "@/lib/orders/queries";
import type { Order } from "@/lib/orders/schema";

export const ADMIN_ORDER_LIMIT = 200;

// Filtering the newest orders in memory avoids a composite Firestore index per filter and allows
// partial matches Firestore can't do; fine at this shop's volume, revisit past a few hundred orders.
export async function listAdminOrders(filters: OrderFilters): Promise<Order[]> {
  await requireAdmin();
  const snapshot = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(ADMIN_ORDER_LIMIT)
    .get();
  return snapshot.docs
    .flatMap((doc) => parseOrder(doc.data()) ?? [])
    .filter((order) => matchesOrderFilters(order, filters));
}

export async function getAdminOrder(id: string): Promise<Order | null> {
  await requireAdmin();
  return parseOrder((await db.collection("orders").doc(id).get()).data());
}
