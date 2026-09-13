import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { fulfillCheckoutSession } from "@/lib/orders/fulfill";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new Response("Webhook not configured or signature missing", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Signature verification needs the exact raw body, so read text rather than JSON.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return Response.json({ received: true, ignored: event.type });
  }

  try {
    const result = await fulfillCheckoutSession(event.data.object);
    if (result === "created") revalidateTag(CATALOG_TAG, "max");
    return Response.json({ received: true, result });
  } catch (error) {
    console.error("Stripe webhook fulfillment failed", event.id, error);
    // A 5xx makes Stripe retry the delivery later.
    return new Response("Fulfillment failed", { status: 500 });
  }
}
