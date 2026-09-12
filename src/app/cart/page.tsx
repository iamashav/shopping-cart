import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>
      <p className="mt-2 text-muted-foreground">Your cart is empty.</p>
    </section>
  );
}
