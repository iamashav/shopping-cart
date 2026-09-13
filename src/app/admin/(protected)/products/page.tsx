import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listAdminProducts } from "@/lib/admin/products";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/dashboard";
import { formatPrice, lowestPriceCents } from "@/lib/catalog/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} products · edit details, prices, stock and visibility.
          </p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants(), "h-10 px-4")}>
          <PlusIcon data-icon="inline-start" />
          New product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              const soldOut = product.variants.filter((v) => v.stock === 0).length;
              const low = product.variants.filter(
                (v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD,
              ).length;

              return (
                <tr key={product.slug}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CoffeeBag
                        name={product.name}
                        origin={product.origin}
                        roast={product.roastLevel}
                        bagColor={product.bagColor}
                        className="w-8 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.origin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={product.active ? "secondary" : "outline"}>
                        {product.active ? "Visible" : "Hidden"}
                      </Badge>
                      {product.featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatPrice(lowestPriceCents(product))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums">{totalStock}</span>
                    {soldOut > 0 && (
                      <span className="ml-2 text-xs text-destructive">{soldOut} sold out</span>
                    )}
                    {low > 0 && <span className="ml-2 text-xs text-brand">{low} low</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.slug}`}
                      className="font-medium text-brand underline-offset-4 hover:underline"
                    >
                      Edit<span className="sr-only"> {product.name}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
