import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_ORDER_LIMIT, listAdminOrders } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/pricing";
import { ordersHref, parseOrderFilters } from "@/lib/orders/filters";
import { ORDER_STATUSES } from "@/lib/orders/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const STATUS_LABELS = { paid: "Paid", shipped: "Shipped", cancelled: "Cancelled" } as const;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const filters = parseOrderFilters(await searchParams);
  const orders = await listAdminOrders(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Newest {ADMIN_ORDER_LIMIT} orders · {orders.length} shown
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {[null, ...ORDER_STATUSES].map((status) => {
            const active = filters.status === status;
            return (
              <Link
                key={status ?? "all"}
                href={ordersHref(filters, { status })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {status ? STATUS_LABELS[status] : "All"}
              </Link>
            );
          })}
        </nav>

        <form action="/admin/orders" className="flex gap-2">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Reference, email or name"
            className="h-9 w-64 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button type="submit" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>
            Search
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="font-heading text-lg font-semibold">No orders match</p>
          <Link
            href="/admin/orders"
            className="mt-1 inline-block text-sm text-brand hover:underline"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-medium text-brand underline-offset-4 hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {order.createdAt.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.customerName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPrice(order.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
