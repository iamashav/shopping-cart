import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getAdminOrder } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/pricing";
import { allowedActions } from "@/lib/orders/lifecycle";
import { cancelOrder, shipOrder } from "../actions";

export const metadata: Metadata = { title: "Order" };

const formatDate = (date: Date) =>
  date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "" : "test/";
  const timeline = [
    { label: "Paid", date: order.createdAt },
    order.shippedAt && { label: "Shipped", date: order.shippedAt },
    order.cancelledAt && { label: "Cancelled and refunded", date: order.cancelledAt },
  ].filter((entry): entry is { label: string; date: Date } => Boolean(entry));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-3xl font-semibold">{order.reference}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderActions
          actions={allowedActions(order.status)}
          totalLabel={formatPrice(order.totalCents)}
          ship={shipOrder.bind(null, order.id)}
          cancel={cancelOrder.bind(null, order.id)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Items</h2>
          <ul className="mt-3 divide-y border-y text-sm">
            {order.items.map((item) => (
              <li
                key={`${item.productSlug}:${item.variantId}`}
                className="flex justify-between gap-4 py-3"
              >
                <span>
                  {item.quantity} ×{" "}
                  <Link href={`/admin/products/${item.productSlug}`} className="hover:underline">
                    {item.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">· {item.label}</span>
                  {item.oversold && (
                    <span className="ml-2 text-xs font-medium text-destructive">Oversold</span>
                  )}
                </span>
                <span className="tabular-nums">{formatPrice(item.totalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{formatPrice(order.shippingCents)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 text-sm">
            <h2 className="text-lg font-semibold">Customer</h2>
            <p className="mt-2">{order.customerName ?? "—"}</p>
            <p className="text-muted-foreground">{order.email}</p>
            {order.shipping && (
              <address className="mt-3 not-italic">
                {order.shipping.name}
                <br />
                {order.shipping.line1}
                {order.shipping.line2 && (
                  <>
                    <br />
                    {order.shipping.line2}
                  </>
                )}
                <br />
                {[order.shipping.city, order.shipping.state, order.shipping.postalCode]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {order.shipping.country}
              </address>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 text-sm">
            <h2 className="text-lg font-semibold">History</h2>
            <ol className="mt-2 space-y-1">
              {timeline.map((entry) => (
                <li key={entry.label} className="flex justify-between gap-3">
                  <span>{entry.label}</span>
                  <span className="text-muted-foreground">{formatDate(entry.date)}</span>
                </li>
              ))}
            </ol>
            {order.paymentIntentId && (
              <a
                href={`https://dashboard.stripe.com/${stripeMode}payments/${order.paymentIntentId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-brand underline-offset-4 hover:underline"
              >
                View payment in Stripe
              </a>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
