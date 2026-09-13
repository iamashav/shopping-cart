import { z } from "zod";

export const ORDER_STATUSES = ["paid", "shipped", "cancelled"] as const;

export const orderItemSchema = z.object({
  productSlug: z.string(),
  variantId: z.string(),
  name: z.string(),
  label: z.string(),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  oversold: z.boolean(),
  // Units actually removed from stock at fulfillment. Missing on orders created before it existed.
  stockTaken: z.number().int().nonnegative().optional(),
});

export const shippingAddressSchema = z.object({
  name: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string(),
});

export const orderSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: z.enum(ORDER_STATUSES),
  email: z.string(),
  emailLower: z.string(),
  customerName: z.string().nullable(),
  shipping: shippingAddressSchema.nullable(),
  items: z.array(orderItemSchema).min(1),
  subtotalCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  currency: z.string(),
  paymentIntentId: z.string().nullable(),
  createdAt: z.date(),
  shippedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  refundId: z.string().optional(),
});

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItem = z.infer<typeof orderItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type Order = z.infer<typeof orderSchema>;
