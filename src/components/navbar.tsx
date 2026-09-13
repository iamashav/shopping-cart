import Image from "next/image";
import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const totalItems = 0;

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="" width={28} height={28} />
          Shopping Cart
        </Link>
        <Link
          href="/cart"
          aria-label={`Cart, ${totalItems} items`}
          className="relative rounded-md p-2 hover:bg-muted"
        >
          <ShoppingCartIcon className="size-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1">{totalItems}</Badge>
          )}
        </Link>
      </nav>
    </header>
  );
}
