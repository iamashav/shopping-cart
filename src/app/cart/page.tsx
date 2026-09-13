import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <section>
      <h1 className="text-4xl font-semibold">Your cart</h1>
      <CartView />
    </section>
  );
}
