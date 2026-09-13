"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { totalItems } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";

export function CartButton() {
  const count = useCart((state) => totalItems(state.lines));

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative rounded-md p-2 hover:bg-muted"
    >
      <ShoppingBagIcon className="size-5" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 bg-brand px-1 text-brand-foreground">
          {count}
        </Badge>
      )}
    </Link>
  );
}
