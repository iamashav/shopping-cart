import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { categorySchema, productSchema, type Category, type Product } from "./schema";

export const CATALOG_TAG = "catalog";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const snapshot = await db.collection("categories").orderBy("position").get();
  return snapshot.docs.map((doc) => categorySchema.parse(doc.data()));
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const snapshot = await db.collection("products").where("active", "==", true).get();
  return snapshot.docs
    .map((doc) => productSchema.parse(doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const doc = await db.collection("products").doc(slug).get();
  if (!doc.exists) return null;
  const product = productSchema.parse(doc.data());
  return product.active ? product : null;
}
