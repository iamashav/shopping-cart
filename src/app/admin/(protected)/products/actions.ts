"use server";

import { updateTag } from "next/cache";
import {
  formDataToValues,
  parseNewProductForm,
  parseProductForm,
  stockConflicts,
  type FieldErrors,
  type FormValues,
} from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { productSchema } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";

// `at` changes on every result so the form remounts with the values it should show.
export type ProductFormState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  | { status: "created"; at: number; slug: string }
  | { status: "invalid"; at: number; fieldErrors: FieldErrors; values: FormValues }
  | { status: "conflict"; at: number; message: string; values: FormValues }
  | { status: "error"; at: number; message: string; values: FormValues };

async function categorySlugs(): Promise<Set<string>> {
  const snapshot = await db.collection("categories").get();
  return new Set(snapshot.docs.map((doc) => doc.id));
}

export async function updateProduct(
  slug: string,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // Server Actions are reachable by direct POST, so authorization can't rely on the page.
  await requireAdmin();
  const values = formDataToValues(formData);
  const at = Date.now();

  try {
    const categories = await categorySlugs();
    const ref = db.collection("products").doc(slug);

    const result = await db.runTransaction(async (transaction): Promise<ProductFormState> => {
      const snapshot = await transaction.get(ref);
      const current = productSchema.safeParse(snapshot.data());
      if (!current.success) {
        return { status: "error", at, message: "This product no longer exists.", values };
      }

      const parsed = parseProductForm(values, current.data, categories);
      if (!parsed.ok) return { status: "invalid", at, fieldErrors: parsed.fieldErrors, values };

      if (stockConflicts(parsed.loadedStock, current.data).length > 0) {
        return {
          status: "conflict",
          at,
          message:
            "Stock changed since you opened this page, probably because an order came in. Reload to see the latest numbers before saving.",
          values,
        };
      }

      transaction.set(ref, parsed.product);
      return { status: "saved", at };
    });

    if (result.status === "saved") updateTag(CATALOG_TAG);
    return result;
  } catch (error) {
    console.error("Saving product failed", slug, error);
    return { status: "error", at, message: "Saving failed. Please try again.", values };
  }
}

export async function createProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const values = formDataToValues(formData);
  const at = Date.now();

  try {
    const parsed = parseNewProductForm(values, await categorySlugs());
    if (!parsed.ok) return { status: "invalid", at, fieldErrors: parsed.fieldErrors, values };

    const ref = db.collection("products").doc(parsed.product.slug);
    const created = await db.runTransaction(async (transaction) => {
      // Checked inside the transaction so two admins can't create the same URL at once.
      if ((await transaction.get(ref)).exists) return false;
      transaction.create(ref, parsed.product);
      return true;
    });

    if (!created) {
      return {
        status: "invalid",
        at,
        fieldErrors: { slug: "A product with this URL already exists." },
        values,
      };
    }

    updateTag(CATALOG_TAG);
    return { status: "created", at, slug: parsed.product.slug };
  } catch (error) {
    console.error("Creating product failed", error);
    return {
      status: "error",
      at,
      message: "Creating the product failed. Please try again.",
      values,
    };
  }
}
