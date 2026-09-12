import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-semibold">Shop</h1>
      <p className="mt-2 text-muted-foreground">This week&apos;s roasts are on their way.</p>
    </section>
  );
}
