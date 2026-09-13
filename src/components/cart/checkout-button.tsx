"use client";

import { useTransition } from "react";
import { LockIcon } from "lucide-react";
import { toast } from "sonner";
import { startCheckout } from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import type { CartLine } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";
import { GRIND_LABELS } from "@/lib/catalog/schema";
import type { Adjustment } from "@/lib/checkout/pricing";

function describe(adjustment: Adjustment, line: CartLine | undefined): string {
  const label = line ? `${line.name} (${line.size}, ${GRIND_LABELS[line.grind]})` : "An item";
  switch (adjustment.reason) {
    case "unavailable":
      return `${label} is sold out and was removed.`;
    case "quantity":
      return `Only ${adjustment.quantity} of ${label} left, so we lowered the quantity.`;
    case "price":
      return `The price of ${label} changed.`;
  }
}

export function CheckoutButton() {
  const lines = useCart((state) => state.lines);
  const adjust = useCart((state) => state.adjust);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    startTransition(async () => {
      const result = await startCheckout(
        lines.map(({ productSlug, variantId, quantity, priceCents }) => ({
          productSlug,
          variantId,
          quantity,
          priceCents,
        })),
      );

      if (result.ok) {
        window.location.assign(result.url);
        return;
      }

      if (result.reason === "adjusted") {
        const messages = result.adjustments.map((adjustment) =>
          describe(
            adjustment,
            lines.find((line) => line.key === adjustment.key),
          ),
        );
        adjust(result.adjustments);
        toast.warning("Your cart was updated", {
          description: `${messages.join(" ")} Please review it and check out again.`,
          duration: 10000,
        });
        return;
      }

      toast.error("We couldn't start checkout", {
        description: "Please try again in a moment.",
      });
    });
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isPending || lines.length === 0}
      className="h-11 w-full text-base"
    >
      <LockIcon data-icon="inline-start" />
      {isPending ? "Starting checkout…" : "Checkout"}
    </Button>
  );
}
