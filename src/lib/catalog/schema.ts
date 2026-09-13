import { z } from "zod";

export const SIZES = ["250g", "1kg"] as const;
export const GRINDS = ["whole-bean", "filter", "espresso"] as const;

export const GRIND_LABELS: Record<(typeof GRINDS)[number], string> = {
  "whole-bean": "Whole bean",
  filter: "Filter",
  espresso: "Espresso",
};

export const categorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  position: z.number().int(),
});

export const variantSchema = z.object({
  id: z.string(),
  size: z.enum(SIZES),
  grind: z.enum(GRINDS),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
});

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  origin: z.string(),
  region: z.string(),
  process: z.string(),
  roastLevel: z.number().int().min(1).max(5),
  tastingNotes: z.array(z.string()).min(1),
  description: z.string(),
  bagColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  featured: z.boolean(),
  active: z.boolean(),
  variants: z.array(variantSchema).min(1),
});

export type Category = z.infer<typeof categorySchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Product = z.infer<typeof productSchema>;
