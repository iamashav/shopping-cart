import { z } from "zod";

export const orderItemSchema = z.object({
  productSlug: z.string(),
  variantId: z.string(),
  name: z.string(),
  label: z.string(),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  oversold: z.boolean(),
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
  status: z.enum(["paid", "shipped", "cancelled"]),
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
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type Order = z.infer<typeof orderSchema>;
