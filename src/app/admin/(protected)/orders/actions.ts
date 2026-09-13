"use server";

import { updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { productSchema, type Product } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";
import { allowedActions, planRestock } from "@/lib/orders/lifecycle";
import { parseOrder } from "@/lib/orders/queries";
import { getStripe } from "@/lib/stripe";

export type OrderActionState =
  | { status: "idle" }
  | { status: "done"; at: number; message: string }
  | { status: "error"; at: number; message: string };

const error = (message: string): OrderActionState => ({ status: "error", at: Date.now(), message });

export async function shipOrder(orderId: string): Promise<OrderActionState> {
  await requireAdmin();
  const ref = db.collection("orders").doc(orderId);

  try {
    return await db.runTransaction(async (transaction) => {
      const order = parseOrder((await transaction.get(ref)).data());
      if (!order) return error("This order no longer exists.");
      if (!allowedActions(order.status).includes("ship")) {
        return error(`This order is already ${order.status}.`);
      }
      transaction.update(ref, { status: "shipped", shippedAt: FieldValue.serverTimestamp() });
      return { status: "done", at: Date.now(), message: `${order.reference} marked as shipped.` };
    });
  } catch (caught) {
    console.error("Marking order shipped failed", orderId, caught);
    return error("Couldn't update the order. Please try again.");
  }
}

export async function cancelOrder(orderId: string): Promise<OrderActionState> {
  await requireAdmin();
  const ref = db.collection("orders").doc(orderId);

  const order = parseOrder((await ref.get()).data());
  if (!order) return error("This order no longer exists.");
  if (!allowedActions(order.status).includes("cancel")) {
    return error(`This order is already ${order.status}.`);
  }
  if (!order.paymentIntentId) return error("This order has no payment to refund.");

  // Refund first: if it fails nothing changes. The idempotency key makes a retry after a later
  // failure return the same refund instead of refunding twice.
  let refundId: string;
  try {
    const refund = await getStripe().refunds.create(
      {
        payment_intent: order.paymentIntentId,
        reason: "requested_by_customer",
        metadata: { orderId, reference: order.reference },
      },
      { idempotencyKey: `cancel-order-${orderId}` },
    );
    refundId = refund.id;
  } catch (caught) {
    console.error("Stripe refund failed", orderId, caught);
    return error("Stripe couldn't refund this payment, so the order wasn't cancelled.");
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const current = parseOrder((await transaction.get(ref)).data());
      if (!current || !allowedActions(current.status).includes("cancel")) {
        return error("The order changed while cancelling. Reload to see its current status.");
      }

      const productRefs = [...new Set(current.items.map((item) => item.productSlug))].map((slug) =>
        db.collection("products").doc(slug),
      );
      const products = new Map<string, Product>();
      for (const snapshot of await transaction.getAll(...productRefs)) {
        const parsed = productSchema.safeParse(snapshot.data());
        if (parsed.success) products.set(parsed.data.slug, parsed.data);
      }

      for (const [slug, variants] of planRestock(current.items, products)) {
        transaction.update(db.collection("products").doc(slug), { variants });
      }
      transaction.update(ref, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        refundId,
      });
      return {
        status: "done",
        at: Date.now(),
        message: `${current.reference} cancelled and refunded.`,
      } satisfies OrderActionState;
    });

    if (result.status === "done") updateTag(CATALOG_TAG);
    return result;
  } catch (caught) {
    console.error("Cancelling order failed after refund", orderId, refundId, caught);
    return error(
      "The payment was refunded but the order couldn't be updated. Try again; it won't refund twice.",
    );
  }
}
