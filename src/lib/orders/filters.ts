import { ORDER_STATUSES, type Order, type OrderStatus } from "./schema";

export type OrderFilters = { status: OrderStatus | null; q: string };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseOrderFilters(params: SearchParams): OrderFilters {
  const status = first(params.status);
  return {
    status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : null,
    q: (first(params.q) ?? "").trim().slice(0, 100),
  };
}

export function matchesOrderFilters(order: Order, { status, q }: OrderFilters): boolean {
  if (status && order.status !== status) return false;
  if (!q) return true;
  const needle = q.toLowerCase();
  return [order.reference, order.emailLower, order.customerName ?? ""].some((field) =>
    field.toLowerCase().includes(needle),
  );
}

export function ordersHref(filters: OrderFilters, patch: Partial<OrderFilters> = {}): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.status) params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  const search = params.toString();
  return search ? `/admin/orders?${search}` : "/admin/orders";
}
