import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { ShopFilters } from "@/components/catalog/shop-filters";
import { filterProducts, parseShopQuery } from "@/lib/catalog/filter";
import { getCategories, getProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <section>
      <h1 className="text-4xl font-semibold">Shop coffee</h1>
      <p className="mt-2 text-muted-foreground">
        Roasted every Monday. Pick your bag size and grind on the next page.
      </p>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ShopResults({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const query = parseShopQuery(await searchParams);
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const results = filterProducts(products, query);

  return (
    <div className="mt-8">
      <ShopFilters query={query} categories={categories} />
      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "coffee" : "coffees"}
      </p>
      {results.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed py-16 text-center">
          <p className="font-heading text-xl font-semibold">No coffee matches those filters</p>
          <Link href="/shop" className="mt-2 inline-block text-sm text-brand hover:underline">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-10 rounded-lg bg-muted" />
      <div className="mt-4 h-8 w-2/3 rounded-full bg-muted" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/5] rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
