"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBagIcon, Trash2Icon } from "lucide-react";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { buttonVariants } from "@/components/ui/button";
import { subtotalCents, totalItems, type CartLine } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/catalog/pricing";
import { GRIND_LABELS } from "@/lib/catalog/schema";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/checkout/pricing";
import { cn } from "@/lib/utils";

function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}

export function CartView() {
  const hydrated = useCartHydrated();
  const lines = useCart((state) => state.lines);

  if (!hydrated) return <CartSkeleton />;
  if (lines.length === 0) return <EmptyCart />;

  const count = totalItems(lines);
  const subtotal = subtotalCents(lines);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="h-fit divide-y rounded-xl border bg-card">
        {lines.map((line) => (
          <CartLineRow key={line.key} line={line} />
        ))}
      </ul>

      <aside className="h-fit rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({count} {count === 1 ? "bag" : "bags"})
            </dt>
            <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>
              {subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? "Free standard shipping" : "From $5.00"}
            </dd>
          </div>
        </dl>
        {subtotal < FREE_SHIPPING_THRESHOLD_CENTS && (
          <p className="mt-3 text-xs text-muted-foreground">
            Add {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS - subtotal)} more for free standard
            shipping.
          </p>
        )}
        <div className="mt-6">
          <CheckoutButton />
        </div>
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Demo store:</span> pay with test card{" "}
          <span className="font-mono whitespace-nowrap">4242 4242 4242 4242</span>, any future date
          and any CVC. No real orders are shipped.
        </p>
        <Link
          href="/shop"
          className="mt-3 block text-center text-sm text-brand underline-offset-4 hover:underline"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);

  return (
    <li className="flex gap-4 p-4">
      <Link
        href={`/shop/${line.productSlug}`}
        className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoffeeBag
          name={line.name}
          origin={line.origin}
          roast={line.roastLevel}
          bagColor={line.bagColor}
          className="w-14"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/shop/${line.productSlug}`}
            className="font-heading text-lg font-semibold hover:underline"
          >
            {line.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {line.size} · {GRIND_LABELS[line.grind]} · {formatPrice(line.priceCents)} each
          </p>
        </div>

        <div className="flex items-center gap-3">
          <QuantityStepper
            value={line.quantity}
            max={line.maxQuantity}
            onChange={(quantity) => setQuantity(line.key, quantity)}
            label={`Quantity of ${line.name}`}
          />
          <p className="w-20 text-right font-medium tabular-nums">
            {formatPrice(line.priceCents * line.quantity)}
          </p>
          <button
            type="button"
            onClick={() => remove(line.key)}
            aria-label={`Remove ${line.name} from cart`}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyCart() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
      <ShoppingBagIcon className="size-8 text-muted-foreground" />
      <p className="mt-4 font-heading text-xl font-semibold">Your cart is empty</p>
      <p className="mt-1 text-sm text-muted-foreground">This week&apos;s roasts are waiting.</p>
      <Link href="/shop" className={cn(buttonVariants(), "mt-6 h-10 px-5")}>
        Shop coffee
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mt-8 grid animate-pulse gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}
