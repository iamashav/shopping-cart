import { z } from "zod";
import { productSchema, type Product } from "@/lib/catalog/schema";

export const MAX_STOCK = 9999;

export type FormValues = Record<string, string>;
export type FieldErrors = Record<string, string>;

export const priceField = (variantId: string) => `price:${variantId}`;
export const stockField = (variantId: string) => `stock:${variantId}`;
export const LOADED_STOCK_FIELD = "loadedStock";

export function formDataToValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value.slice(0, 2000);
  }
  return values;
}

export function productToValues(product: Product): FormValues {
  const values: FormValues = {
    name: product.name,
    categorySlug: product.categorySlug,
    origin: product.origin,
    region: product.region,
    process: product.process,
    roastLevel: String(product.roastLevel),
    tastingNotes: product.tastingNotes.join(", "),
    description: product.description,
    bagColor: product.bagColor,
    featured: product.featured ? "on" : "",
    active: product.active ? "on" : "",
    [LOADED_STOCK_FIELD]: JSON.stringify(
      Object.fromEntries(product.variants.map((variant) => [variant.id, variant.stock])),
    ),
  };
  for (const variant of product.variants) {
    values[priceField(variant.id)] = (variant.priceCents / 100).toFixed(2);
    values[stockField(variant.id)] = String(variant.stock);
  }
  return values;
}

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const detailsSchema = z.object({
  name: text("Name", 60),
  origin: text("Origin", 60),
  region: text("Region", 80),
  process: text("Process", 60),
  description: text("Description", 600),
  roastLevel: z.coerce.number().int().min(1).max(5),
  bagColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a valid colour."),
  tastingNotes: z
    .string()
    .transform((raw) =>
      raw
        .split(",")
        .map((note) => note.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().max(30, "Each tasting note must be 30 characters or fewer."))
        .min(1, "Add at least one tasting note.")
        .max(6, "Use at most six tasting notes."),
    ),
});

function parsePriceCents(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,4}(\.\d{1,2})?$/.test(raw.trim())) return null;
  const cents = Math.round(Number(raw.trim()) * 100);
  return cents > 0 ? cents : null;
}

function parseStock(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,4}$/.test(raw.trim())) return null;
  const stock = Number(raw.trim());
  return stock <= MAX_STOCK ? stock : null;
}

function parseLoadedStock(raw: string | undefined): Record<string, number> | null {
  try {
    const parsed = z.record(z.string(), z.number().int()).safeParse(JSON.parse(raw ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type ParsedProductForm =
  | { ok: true; product: Product; loadedStock: Record<string, number> }
  | { ok: false; fieldErrors: FieldErrors };

// Slug, sizes, grinds and variant ids come from the stored product, never from the form.
export function parseProductForm(
  values: FormValues,
  current: Product,
  categorySlugs: Set<string>,
): ParsedProductForm {
  const fieldErrors: FieldErrors = {};

  const details = detailsSchema.safeParse(values);
  if (!details.success) {
    for (const issue of details.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
  }

  if (!categorySlugs.has(values.categorySlug ?? "")) fieldErrors.categorySlug = "Pick a category.";

  const variants = current.variants.map((variant) => {
    const priceCents = parsePriceCents(values[priceField(variant.id)]);
    const stock = parseStock(values[stockField(variant.id)]);
    if (priceCents === null) fieldErrors[priceField(variant.id)] = "Enter a price like 18.50.";
    if (stock === null) fieldErrors[stockField(variant.id)] = `Enter 0–${MAX_STOCK}.`;
    return { ...variant, priceCents: priceCents ?? 0, stock: stock ?? 0 };
  });

  const loadedStock = parseLoadedStock(values[LOADED_STOCK_FIELD]);
  if (!loadedStock) fieldErrors.form = "The form is out of date. Reload the page and try again.";

  if (!details.success || Object.keys(fieldErrors).length > 0 || !loadedStock) {
    return { ok: false, fieldErrors };
  }

  const product = productSchema.parse({
    ...current,
    ...details.data,
    categorySlug: values.categorySlug,
    featured: values.featured === "on",
    active: values.active === "on",
    variants,
  });
  return { ok: true, product, loadedStock };
}

// Stock can change under an open form when an order is paid; saving then would undo that sale.
export function stockConflicts(loadedStock: Record<string, number>, current: Product): string[] {
  return current.variants
    .filter((variant) => loadedStock[variant.id] !== variant.stock)
    .map((variant) => variant.id);
}
