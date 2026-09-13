import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/orders/order-lookup-form";

export const metadata: Metadata = { title: "Find your order", robots: { index: false } };

export default function OrdersPage() {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-4xl font-semibold">Find your order</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the reference from your confirmation page and the email you used at checkout.
      </p>
      <div className="mt-8">
        <OrderLookupForm />
      </div>
    </section>
  );
}
