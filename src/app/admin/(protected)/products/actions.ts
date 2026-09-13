"use server";

import { updateTag } from "next/cache";
import {
  formDataToValues,
  parseProductForm,
  stockConflicts,
  type FieldErrors,
  type FormValues,
} from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { productSchema } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";

export type ProductFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | { status: "invalid"; fieldErrors: FieldErrors; values: FormValues }
  | { status: "conflict"; message: string; values: FormValues }
  | { status: "error"; message: string; values: FormValues };

export async function updateProduct(
  slug: string,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // Server Actions are reachable by direct POST, so authorization can't rely on the page.
  await requireAdmin();
  const values = formDataToValues(formData);

  try {
    const categories = await db.collection("categories").get();
    const categorySlugs = new Set(categories.docs.map((doc) => doc.id));
    const ref = db.collection("products").doc(slug);

    const result = await db.runTransaction(async (transaction): Promise<ProductFormState> => {
      const snapshot = await transaction.get(ref);
      const current = productSchema.safeParse(snapshot.data());
      if (!current.success) {
        return { status: "error", message: "This product no longer exists.", values };
      }

      const parsed = parseProductForm(values, current.data, categorySlugs);
      if (!parsed.ok) return { status: "invalid", fieldErrors: parsed.fieldErrors, values };

      if (stockConflicts(parsed.loadedStock, current.data).length > 0) {
        return {
          status: "conflict",
          message:
            "Stock changed since you opened this page, probably because an order came in. Reload to see the latest numbers before saving.",
          values,
        };
      }

      transaction.set(ref, parsed.product);
      return { status: "saved", savedAt: Date.now() };
    });

    if (result.status === "saved") updateTag(CATALOG_TAG);
    return result;
  } catch (error) {
    console.error("Saving product failed", slug, error);
    return { status: "error", message: "Saving failed. Please try again.", values };
  }
}
