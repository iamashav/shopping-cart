import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { getAdminProduct, listCategories } from "@/lib/admin/products";
import { updateProduct } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function AdminProductEditPage({
  params,
}: PageProps<"/admin/products/[slug]">) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(slug), listCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        All products
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        {product.active && (
          <Link
            href={`/shop/${product.slug}`}
            className="text-sm text-brand underline-offset-4 hover:underline"
          >
            View in shop
          </Link>
        )}
      </div>
      <ProductEditForm
        product={product}
        categories={categories}
        action={updateProduct.bind(null, product.slug)}
      />
    </div>
  );
}
