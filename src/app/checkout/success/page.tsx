import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2Icon } from "lucide-react";
import { ClearCart } from "@/components/cart/clear-cart";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/pricing";
import { getStripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense
      fallback={<div className="mx-auto h-96 max-w-xl animate-pulse rounded-xl bg-muted" />}
    >
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirmation({
  searchParams,
}: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) notFound();

  const session = await getStripe()
    .checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] })
    .catch(() => notFound());

  const paid = session.payment_status === "paid";
  const shipping = session.collected_information?.shipping_details;

  return (
    <section className="mx-auto max-w-xl rounded-xl border bg-card p-8">
      {paid && <ClearCart />}
      <CheckCircle2Icon className="size-10 text-sage" />
      <h1 className="mt-4 text-3xl font-semibold">
        {paid ? "Thank you for your order" : "Your payment is processing"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {session.customer_details?.email
          ? `A confirmation would be sent to ${session.customer_details.email}.`
          : "We've received your order."}{" "}
        Bloom is a demo store, so nothing will be shipped.
      </p>

      <ul className="mt-6 divide-y border-y text-sm">
        {session.line_items?.data.map((item) => {
          const product = item.price?.product;
          const variant =
            typeof product === "object" && !product.deleted ? product.description : null;
          return (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <span>
                {item.quantity} × {item.description}
                {variant && <span className="text-muted-foreground"> · {variant}</span>}
              </span>
              <span className="tabular-nums">{formatPrice(item.amount_total)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="tabular-nums">
            {formatPrice(session.total_details?.amount_shipping ?? 0)}
          </dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(session.amount_total ?? 0)}</dd>
        </div>
      </dl>

      {shipping && (
        <div className="mt-6 text-sm">
          <p className="font-medium">Shipping to</p>
          <p className="text-muted-foreground">
            {shipping.name}, {shipping.address.city}, {shipping.address.country}
          </p>
        </div>
      )}

      <Link href="/shop" className={cn(buttonVariants(), "mt-8 h-10 w-full")}>
        Keep browsing
      </Link>
    </section>
  );
}
