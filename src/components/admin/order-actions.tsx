"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderActionState } from "@/app/admin/(protected)/orders/actions";
import { Button } from "@/components/ui/button";
import type { OrderAction } from "@/lib/orders/lifecycle";

type OrderActionsProps = {
  actions: OrderAction[];
  totalLabel: string;
  ship: () => Promise<OrderActionState>;
  cancel: () => Promise<OrderActionState>;
};

export function OrderActions({ actions, totalLabel, ship, cancel }: OrderActionsProps) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (actions.length === 0) return null;

  function run(action: () => Promise<OrderActionState>) {
    startTransition(async () => {
      const result = await action();
      setConfirmingCancel(false);
      if (result.status === "done") toast.success(result.message);
      if (result.status === "error") toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.includes("ship") && (
        <Button onClick={() => run(ship)} disabled={isPending} className="h-10 px-5">
          Mark as shipped
        </Button>
      )}
      {actions.includes("cancel") &&
        (confirmingCancel ? (
          <div
            role="group"
            aria-label="Confirm cancellation"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            <span>Refund {totalLabel} and return the stock?</span>
            <Button
              variant="destructive"
              onClick={() => run(cancel)}
              disabled={isPending}
              className="h-9"
            >
              {isPending ? "Refunding…" : "Yes, cancel and refund"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmingCancel(false)}
              disabled={isPending}
              className="h-9"
            >
              Keep order
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setConfirmingCancel(true)}
            disabled={isPending}
            className="h-10 px-5"
          >
            Cancel and refund
          </Button>
        ))}
    </div>
  );
}
