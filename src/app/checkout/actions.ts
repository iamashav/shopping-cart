"use server";

import { headers } from "next/headers";
import { GRIND_LABELS, productSchema, type Product } from "@/lib/catalog/schema";
import {
  EXPRESS_SHIPPING_CENTS,
  checkoutRequestSchema,
  priceCart,
  standardShippingCents,
  subtotalOf,
  type Adjustment,
} from "@/lib/checkout/pricing";
import { db } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "invalid" | "error" }
  | { ok: false; reason: "adjusted"; adjustments: Adjustment[] };

const SHIPPING_COUNTRIES = ["US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL"] as const;

// Read straight from Firestore rather than the cached catalog so prices and stock are current.
async function loadProducts(slugs: string[]): Promise<Map<string, Product>> {
  const refs = [...new Set(slugs)].map((slug) => db.collection("products").doc(slug));
  const snapshots = await db.getAll(...refs);
  const products = new Map<string, Product>();
  for (const snapshot of snapshots) {
    const parsed = productSchema.safeParse(snapshot.data());
    if (parsed.success) products.set(parsed.data.slug, parsed.data);
  }
  return products;
}

async function siteOrigin(): Promise<string> {
  const origin = (await headers()).get("origin");
  if (origin && URL.canParse(origin)) return new URL(origin).origin;
  return process.env.URL ?? "http://localhost:3000";
}

export async function startCheckout(input: unknown): Promise<CheckoutResult> {
  const request = checkoutRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, reason: "invalid" };

  try {
    const products = await loadProducts(request.data.map((line) => line.productSlug));
    const { lines, adjustments } = priceCart(request.data, products);
    if (adjustments.length > 0) return { ok: false, reason: "adjusted", adjustments };

    const origin = await siteOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      branding_settings: {
        display_name: "Bloom",
        background_color: "#f8f4ec",
        button_color: "#4a2f22",
        font_family: "lora",
        border_style: "rounded",
      },
      line_items: lines.map(({ product, variant, quantity }) => ({
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: variant.priceCents,
          product_data: {
            name: product.name,
            description: `${variant.size} · ${GRIND_LABELS[variant.grind]}`,
            metadata: { productSlug: product.slug, variantId: variant.id },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Standard",
            fixed_amount: { amount: standardShippingCents(subtotalOf(lines)), currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Express",
            fixed_amount: { amount: EXPRESS_SHIPPING_CENTS, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 2 },
            },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    if (!session.url) return { ok: false, reason: "error" };
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("Checkout failed", error);
    return { ok: false, reason: "error" };
  }
}
