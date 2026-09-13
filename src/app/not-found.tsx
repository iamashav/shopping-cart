import type { Metadata } from "next";
import Link from "next/link";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
      <CoffeeBag
        name="Not found"
        origin="Error 404"
        roast={1}
        bagColor="#9c6b4e"
        className="w-32 -rotate-6 drop-shadow-xl"
        aria-hidden="true"
      />
      <h1 className="mt-8 text-4xl font-semibold">This bag is empty</h1>
      <p className="mt-3 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or the coffee is no longer on the menu.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={cn(buttonVariants(), "h-10 px-5")}>
          Browse coffee
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
          Go home
        </Link>
      </div>
    </section>
  );
}
