import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { productSchema, type Product } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import { planFulfillment, type PaidLine } from "./fulfillment";
import { orderReference } from "./reference";
import type { ShippingAddress } from "./schema";

async function paidLines(sessionId: string): Promise<PaidLine[]> {
  const lineItems = await getStripe().checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });

  return lineItems.data.map((item) => {
    const product = item.price?.product;
    if (!product || typeof product === "string" || product.deleted) {
      throw new Error(`Line item ${item.id} has no product details`);
    }
    const { productSlug, variantId } = product.metadata;
    if (!productSlug || !variantId) {
      throw new Error(`Line item ${item.id} is missing product metadata`);
    }
    return {
      productSlug,
      variantId,
      name: product.name,
      label: product.description ?? variantId,
      quantity: item.quantity ?? 1,
      unitAmountCents: item.price?.unit_amount ?? 0,
      totalCents: item.amount_total,
    };
  });
}

function shippingAddress(session: Stripe.Checkout.Session): ShippingAddress | null {
  const details = session.collected_information?.shipping_details;
  if (!details) return null;
  const { address } = details;
  return {
    name: details.name,
    line1: address.line1 ?? "",
    line2: address.line2 ?? null,
    city: address.city ?? "",
    state: address.state ?? null,
    postalCode: address.postal_code ?? null,
    country: address.country ?? "",
  };
}

export type FulfillmentResult = "created" | "already-fulfilled" | "not-paid";

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  if (session.payment_status !== "paid") return "not-paid";

  const orderRef = db.collection("orders").doc(session.id);
  if ((await orderRef.get()).exists) return "already-fulfilled";

  const lines = await paidLines(session.id);
  const productRefs = [...new Set(lines.map((line) => line.productSlug))].map((slug) =>
    db.collection("products").doc(slug),
  );
  const email = session.customer_details?.email ?? "";

  // Stripe retries deliveries, so the existence check is repeated inside the transaction
  // to make concurrent retries write the order and decrement stock only once.
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists) return "already-fulfilled";

    const snapshots = await transaction.getAll(...productRefs);
    const products = new Map<string, Product>();
    for (const snapshot of snapshots) {
      const parsed = productSchema.safeParse(snapshot.data());
      if (parsed.success) products.set(parsed.data.slug, parsed.data);
    }

    const { items, updatedVariants } = planFulfillment(lines, products);

    for (const [slug, variants] of updatedVariants) {
      transaction.update(db.collection("products").doc(slug), { variants });
    }

    transaction.set(orderRef, {
      id: session.id,
      reference: orderReference(session.id),
      status: "paid",
      email,
      emailLower: email.toLowerCase(),
      customerName: session.customer_details?.name ?? null,
      shipping: shippingAddress(session),
      items,
      subtotalCents: session.amount_subtotal ?? 0,
      shippingCents: session.total_details?.amount_shipping ?? 0,
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      createdAt: FieldValue.serverTimestamp(),
    });

    return "created";
  });
}
