"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY_PER_LINE, lineKey, toCartLine } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/catalog/pricing";
import { GRIND_LABELS, GRINDS, SIZES, type Product, type Variant } from "@/lib/catalog/schema";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;

type Size = Variant["size"];
type Grind = Variant["grind"];

function findVariant(product: Product, size: Size, grind: Grind) {
  return product.variants.find((variant) => variant.size === size && variant.grind === grind);
}

function initialVariant(product: Product): Variant {
  return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
}

function stockMessage(variant: Variant | undefined) {
  if (!variant || variant.stock === 0) return { text: "Sold out", tone: "text-destructive" };
  if (variant.stock <= LOW_STOCK_THRESHOLD) {
    return { text: `Only ${variant.stock} left`, tone: "text-brand" };
  }
  return { text: "In stock, ships within 48 hours", tone: "text-muted-foreground" };
}

type OptionGroupProps<T extends string> = {
  legend: string;
  name: string;
  options: readonly T[];
  value: T;
  label: (option: T) => string;
  isAvailable: (option: T) => boolean;
  onChange: (option: T) => void;
};

function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  label,
  isAvailable,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const available = isAvailable(option);
          return (
            <label
              key={option}
              className={cn(
                "relative cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                option === value ? "border-primary" : "hover:bg-muted",
                option === value && available ? "bg-primary text-primary-foreground" : "bg-card",
                !available && "text-muted-foreground line-through decoration-1",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={option === value}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {label(option)}
              {!available && <span className="sr-only"> (sold out)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function VariantPicker({ product }: { product: Product }) {
  const id = useId();
  const start = initialVariant(product);
  const [size, setSize] = useState<Size>(start.size);
  const [grind, setGrind] = useState<Grind>(start.grind);

  const selected = findVariant(product, size, grind);
  const stock = stockMessage(selected);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-2xl font-medium">{selected && formatPrice(selected.priceCents)}</p>
        <p className={cn("mt-1 text-sm", stock.tone)} aria-live="polite">
          {stock.text}
        </p>
      </div>

      <OptionGroup
        legend="Bag size"
        name={`${id}-size`}
        options={SIZES}
        value={size}
        label={(option) => option}
        isAvailable={(option) =>
          product.variants.some((variant) => variant.size === option && variant.stock > 0)
        }
        onChange={setSize}
      />

      <OptionGroup
        legend="Grind"
        name={`${id}-grind`}
        options={GRINDS}
        value={grind}
        label={(option) => GRIND_LABELS[option]}
        isAvailable={(option) => (findVariant(product, size, option)?.stock ?? 0) > 0}
        onChange={setGrind}
      />

      {selected && <AddToCart key={selected.id} product={product} variant={selected} />}
    </div>
  );
}

function AddToCart({ product, variant }: { product: Product; variant: Variant }) {
  const router = useRouter();
  const add = useCart((state) => state.add);
  const inCart = useCart(
    (state) => state.lines.find((line) => line.key === lineKey(product.slug, variant.id))?.quantity,
  );
  const [quantity, setQuantity] = useState(1);

  const max = Math.min(variant.stock, MAX_QUANTITY_PER_LINE) - (inCart ?? 0);
  const soldOut = variant.stock === 0;
  const effectiveQuantity = Math.min(quantity, Math.max(max, 1));

  function handleAdd() {
    add(toCartLine(product, variant, effectiveQuantity));
    setQuantity(1);
    toast.success(`${product.name} added to your cart`, {
      description: `${effectiveQuantity} × ${variant.size}, ${GRIND_LABELS[variant.grind].toLowerCase()}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-3">
        <QuantityStepper
          value={effectiveQuantity}
          max={Math.max(max, 1)}
          onChange={setQuantity}
          label="Quantity"
        />
        <Button onClick={handleAdd} disabled={soldOut || max < 1} className="h-10 flex-1 text-base">
          {soldOut ? "Sold out" : "Add to cart"}
        </Button>
      </div>
      {!soldOut && max < 1 && (
        <p className="text-sm text-muted-foreground">
          You already have the most we can sell of this option in your cart.
        </p>
      )}
    </div>
  );
}
