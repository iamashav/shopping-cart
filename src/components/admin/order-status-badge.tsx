import type { OrderStatus } from "@/lib/orders/schema";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-brand/15 text-foreground" },
  shipped: { label: "Shipped", className: "bg-sage/25 text-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>{label}</span>
  );
}
