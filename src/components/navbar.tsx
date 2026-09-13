import Link from "next/link";
import { BloomMark } from "@/components/brand/bloom-mark";
import { CartButton } from "@/components/cart/cart-button";

export function Navbar() {
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
          <CartButton />
        </div>
      </nav>
    </header>
  );
}
