"use client";

import { useActionState } from "react";
import { lookupOrder, type LookupState, type OrderSummary } from "@/app/orders/actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/pricing";

const STATUS_LABELS: Record<OrderSummary["status"], string> = {
  paid: "Paid, preparing to roast",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

const inputClass =
  "mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function OrderLookupForm({ defaultReference = "" }: { defaultReference?: string }) {
  const [state, action, isPending] = useActionState<LookupState, FormData>(lookupOrder, {
    status: "idle",
  });
  const values =
    state.status === "idle" ? { reference: defaultReference, email: "" } : state.values;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-xl border bg-card p-6">
        <label className="block text-sm font-medium">
          Order reference
          <input
            name="reference"
            required
            defaultValue={values.reference}
            placeholder="BLM-1A2B3C4D"
            autoComplete="off"
            className={`${inputClass} font-mono uppercase`}
          />
        </label>
        <label className="block text-sm font-medium">
          Email used at checkout
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={values.email}
            className={inputClass}
          />
        </label>
        <Button type="submit" disabled={isPending} className="h-10 w-full">
          {isPending ? "Looking up…" : "Find my order"}
        </Button>
        <div aria-live="polite" className="text-sm">
          {state.status === "invalid" && <p className="text-destructive">{state.message}</p>}
          {state.status === "not-found" && (
            <p className="text-destructive">
              We couldn&apos;t find an order with that reference and email.
            </p>
          )}
        </div>
      </form>

      {state.status === "found" && <OrderDetails order={state.order} />}
    </div>
  );
}

function OrderDetails({ order }: { order: OrderSummary }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-lg font-semibold">{order.reference}</h2>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {new Date(order.placedOn).toLocaleDateString(undefined, { dateStyle: "long" })}
        {order.shipTo && ` · shipping to ${order.shipTo}`}
      </p>
      <ul className="mt-4 divide-y border-y text-sm">
        {order.items.map((item) => (
          <li key={`${item.name}-${item.label}`} className="flex justify-between gap-4 py-3">
            <span>
              {item.quantity} × {item.name}{" "}
              <span className="text-muted-foreground">· {item.label}</span>
            </span>
            <span className="tabular-nums">{formatPrice(item.totalCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-sm">
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
  );
}
