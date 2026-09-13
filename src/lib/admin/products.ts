import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { categorySchema, productSchema, type Category, type Product } from "@/lib/catalog/schema";
import { db } from "@/lib/firebase/admin";

// Admin reads skip the shop's cache and include hidden products, so edits and stock are current.
export async function listAdminProducts(): Promise<Product[]> {
  await requireAdmin();
  const snapshot = await db.collection("products").get();
  return snapshot.docs
    .flatMap((doc) => {
      const parsed = productSchema.safeParse(doc.data());
      return parsed.success ? [parsed.data] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdminProduct(slug: string): Promise<Product | null> {
  await requireAdmin();
  const doc = await db.collection("products").doc(slug).get();
  const parsed = productSchema.safeParse(doc.data());
  return parsed.success ? parsed.data : null;
}

export async function listCategories(): Promise<Category[]> {
  await requireAdmin();
  const snapshot = await db.collection("categories").orderBy("position").get();
  return snapshot.docs.map((doc) => categorySchema.parse(doc.data()));
}
