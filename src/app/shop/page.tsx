import type { Metadata } from "next";
import { ProductCard } from "@/components/catalog/product-card";
import { getProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <section>
      <h1 className="text-4xl font-semibold">Shop coffee</h1>
      <p className="mt-2 text-muted-foreground">
        Roasted every Monday. Pick your bag size and grind on the next page.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
