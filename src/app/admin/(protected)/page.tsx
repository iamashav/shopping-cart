import type { Metadata } from "next";
import { LOW_STOCK_THRESHOLD, getDashboard } from "@/lib/admin/dashboard";
import { getRuntimeInfo } from "@/lib/admin/runtime";
import { formatPrice } from "@/lib/catalog/pricing";
import { GRIND_LABELS } from "@/lib/catalog/schema";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { orderCount, revenueCents, recentOrders, lowStock } = await getDashboard();

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: orderCount.toString() },
          { label: "Revenue (test mode)", value: formatPrice(revenueCents) },
          {
            label: `Variants at ${LOW_STOCK_THRESHOLD} or fewer`,
            value: lowStock.length.toString(),
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-xl font-semibold">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-mono">{order.reference}</td>
                    <td className="px-4 py-3">
                      {order.createdAt.toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      {order.items.some((item) => item.oversold) && (
                        <span className="ml-2 text-xs text-destructive">oversold</span>
                      )}
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
      </section>

      <section>
        <h2 className="text-xl font-semibold">Low stock</h2>
        {lowStock.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Everything is well stocked.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card text-sm">
            {lowStock.map(({ product, variant, slug }) => (
              <li key={`${slug}:${variant.id}`} className="flex justify-between gap-4 px-4 py-3">
                <span>
                  {product}{" "}
                  <span className="text-muted-foreground">
                    · {variant.size} · {GRIND_LABELS[variant.grind]}
                  </span>
                </span>
                <span
                  className={
                    variant.stock === 0
                      ? "font-medium text-destructive"
                      : "font-medium tabular-nums"
                  }
                >
                  {variant.stock === 0 ? "Sold out" : `${variant.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RuntimeInfo />
    </div>
  );
}

function RuntimeInfo() {
  const runtime = getRuntimeInfo();
  const rows = [
    { label: "Node", value: runtime.node },
    { label: "require(esm)", value: runtime.requireModule ? "supported" : "not supported" },
    { label: "Platform", value: runtime.platform },
    {
      label: "NODE_OPTIONS disables require(esm)",
      value: runtime.nodeOptionsDisableRequireModule ? "yes" : "no",
    },
    {
      label: "Launch flags disable require(esm)",
      value: runtime.launchFlagsDisableRequireModule ? "yes" : "no",
    },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold">Server runtime</h2>
      <dl className="mt-3 grid gap-x-8 gap-y-2 rounded-xl border bg-card p-4 font-mono text-sm sm:grid-cols-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
