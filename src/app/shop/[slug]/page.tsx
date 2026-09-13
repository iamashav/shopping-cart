import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { CoffeeBag } from "@/components/brand/coffee-bag";
import { RoastLevel } from "@/components/catalog/roast-level";
import { VariantPicker } from "@/components/catalog/variant-picker";
import { Badge } from "@/components/ui/badge";
import { getProduct, getProducts } from "@/lib/catalog/queries";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const details = [
    { label: "Origin", value: product.origin },
    { label: "Region", value: product.region },
    { label: "Process", value: product.process },
  ];

  return (
    <article>
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        All coffee
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted">
          <CoffeeBag
            name={product.name}
            origin={product.origin}
            roast={product.roastLevel}
            bagColor={product.bagColor}
            className="w-3/5 drop-shadow-2xl"
          />
        </div>

        <div>
          <h1 className="text-4xl font-semibold md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.tastingNotes.map((note) => (
              <Badge key={note} variant="outline">
                {note}
              </Badge>
            ))}
          </div>

          <div className="mt-6">
            <VariantPicker product={product} />
          </div>

          <p className="mt-8 text-muted-foreground">{product.description}</p>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-y py-4 text-sm">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <RoastLevel level={product.roastLevel} className="mt-4" />
        </div>
      </div>
    </article>
  );
}
