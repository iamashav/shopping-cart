import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { listCategories } from "@/lib/admin/products";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "New product" };

export default async function AdminNewProductPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        All products
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every coffee is sold in 250g and 1kg bags, as whole bean, filter or espresso grind.
        </p>
      </div>
      <ProductEditForm categories={categories} action={createProduct} />
    </div>
  );
}
