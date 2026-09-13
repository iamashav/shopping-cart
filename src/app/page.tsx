import Link from "next/link";
import { FlameIcon, SproutIcon, TruckIcon } from "lucide-react";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button";
import { getProducts } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

const PROCESS = [
  {
    icon: SproutIcon,
    title: "Traceable sourcing",
    body: "Every roast traces back to the farms and co-ops that grew it, named on the bag.",
  },
  {
    icon: FlameIcon,
    title: "Roasted every Monday",
    body: "Small batches, profiled per bean, so nothing sits on a shelf for months.",
  },
  {
    icon: TruckIcon,
    title: "Shipped within 48 hours",
    body: "Ground to order for your brewer, or left whole bean if you grind at home.",
  },
];

export default async function HomePage() {
  const featured = (await getProducts()).filter((product) => product.featured);

  return (
    <>
      <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-16">
        <div>
          <p className="text-sm font-medium tracking-widest text-brand uppercase">
            Small-batch specialty coffee
          </p>
          <h1 className="mt-3 text-5xl leading-[1.05] font-semibold text-balance md:text-6xl">
            Coffee worth slowing down for.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Seasonal single origins and house blends, roasted weekly and ground the way you brew.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={cn(buttonVariants(), "h-11 px-6 text-base")}>
              Shop coffee
            </Link>
            <Link
              href="#process"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6 text-base")}
            >
              How we roast
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex h-60 w-full max-w-md items-end justify-center md:h-80">
          <CoffeeBag
            name="Huila Pink"
            origin="Colombia · Washed"
            roast={2}
            bagColor="#d98b73"
            className="absolute bottom-0 left-0 w-32 -rotate-6 drop-shadow-xl md:w-40"
          />
          <CoffeeBag
            name="Sunday Blend"
            origin="Brazil & Ethiopia"
            roast={3}
            bagColor="#3b261b"
            className="relative z-10 w-40 drop-shadow-2xl md:w-48"
          />
          <CoffeeBag
            name="Yirgacheffe"
            origin="Ethiopia · Natural"
            roast={1}
            bagColor="#8fa587"
            className="absolute right-0 bottom-0 w-32 rotate-6 drop-shadow-xl md:w-40"
          />
        </div>
      </section>

      <section className="py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold">This week&apos;s roasts</h2>
          <Link href="/shop" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section id="process" className="scroll-mt-20 py-16">
        <h2 className="text-3xl font-semibold">From farm to your cup</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PROCESS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="size-6 text-brand" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
