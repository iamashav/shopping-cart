"use server";

import { z } from "zod";
import { ORDER_REFERENCE_PATTERN } from "@/lib/orders/reference";
import { findOrderByReference } from "@/lib/orders/queries";

export type OrderSummary = {
  reference: string;
  status: "paid" | "shipped" | "cancelled";
  placedOn: string;
  items: { name: string; label: string; quantity: number; totalCents: number }[];
  shippingCents: number;
  totalCents: number;
  shipTo: string | null;
};

export type LookupValues = { reference: string; email: string };

// The submitted values are returned so the form can show them again: React resets forms after a
// Server Action runs, which would otherwise wipe what the customer typed.
export type LookupState =
  | { status: "idle" }
  | { status: "invalid"; message: string; values: LookupValues }
  | { status: "not-found"; values: LookupValues }
  | { status: "found"; order: OrderSummary; values: LookupValues };

const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ORDER_REFERENCE_PATTERN, "Order references look like BLM-1A2B3C4D."),
  email: z.email("Enter the email you used at checkout."),
});

export async function lookupOrder(
  _previous: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const values: LookupValues = {
    reference: String(formData.get("reference") ?? "").slice(0, 50),
    email: String(formData.get("email") ?? "").slice(0, 320),
  };
  const input = lookupSchema.safeParse(values);
  if (!input.success) {
    return {
      status: "invalid",
      message: input.error.issues[0]?.message ?? "Check your details.",
      values,
    };
  }

  const order = await findOrderByReference(input.data.reference, input.data.email);
  if (!order) return { status: "not-found", values };

  return {
    status: "found",
    values,
    order: {
      reference: order.reference,
      status: order.status,
      placedOn: order.createdAt.toISOString(),
      items: order.items.map(({ name, label, quantity, totalCents }) => ({
        name,
        label,
        quantity,
        totalCents,
      })),
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      shipTo: order.shipping ? `${order.shipping.city}, ${order.shipping.country}` : null,
    },
  };
}
