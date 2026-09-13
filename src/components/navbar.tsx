import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { BloomMark } from "@/components/brand/bloom-mark";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const totalItems = 0;

  return (
    <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <BloomMark className="size-7" />
          <span className="font-heading text-xl font-semibold tracking-tight">Bloom</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/shop" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Shop
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${totalItems} items`}
            className="relative rounded-md p-2 hover:bg-muted"
          >
            <ShoppingBagIcon className="size-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 bg-brand px-1 text-brand-foreground">
                {totalItems}
              </Badge>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
