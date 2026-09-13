import Link from "next/link";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { RoastLevel } from "@/components/catalog/roast-level";
import { Badge } from "@/components/ui/badge";
import { formatPrice, isSoldOut, lowestPriceCents } from "@/lib/catalog/pricing";
import type { Product } from "@/lib/catalog/schema";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative flex aspect-square items-center justify-center rounded-lg bg-muted">
        <CoffeeBag
          name={product.name}
          origin={product.origin}
          roast={product.roastLevel}
          bagColor={product.bagColor}
          className="w-3/5 drop-shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-2"
        />
        {soldOut && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Sold out
          </Badge>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            {product.origin} · {product.region}
          </p>
        </div>
        <p className="text-sm font-medium whitespace-nowrap">
          from {formatPrice(lowestPriceCents(product))}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{product.tastingNotes.join(", ")}</p>
      <RoastLevel level={product.roastLevel} className="mt-3" />
    </Link>
  );
}
