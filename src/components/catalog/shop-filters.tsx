"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  ROAST_RANGES,
  SORT_OPTIONS,
  shopHref,
  type Roast,
  type ShopQuery,
  type Sort,
} from "@/lib/catalog/filter";
import type { Category } from "@/lib/catalog/schema";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

function Chip({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export function ShopFilters({ query, categories }: { query: ShopQuery; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);
  const [pushedQ, setPushedQ] = useState(query.q);

  // The URL's q changed without us pushing it (e.g. "Clear filters"), so reset the input.
  // Our own debounced pushes are skipped so text typed while navigating isn't overwritten.
  if (query.q !== pushedQ) {
    setPushedQ(query.q);
    setSearch(query.q);
  }

  useEffect(() => {
    const next = search.trim();
    if (next === query.q) return;
    const timeout = setTimeout(() => {
      setPushedQ(next);
      startTransition(() => router.replace(shopHref(query, { q: next }), { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search, query, router]);

  return (
    <div className={cn("space-y-4 transition-opacity", isPending && "opacity-70")}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search coffee</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, origin or tasting note"
            className="h-10 w-full rounded-lg border bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-muted-foreground">Sort by</span>
          <select
            value={query.sort}
            onChange={(event) =>
              startTransition(() =>
                router.replace(shopHref(query, { sort: event.target.value as Sort }), {
                  scroll: false,
                }),
              )
            }
            className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip href={shopHref(query, { category: null })} active={!query.category}>
          All coffee
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.slug}
            href={shopHref(query, { category: category.slug })}
            active={query.category === category.slug}
          >
            {category.name}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        {(Object.entries(ROAST_RANGES) as [Roast, (typeof ROAST_RANGES)[Roast]][]).map(
          ([roast, { label }]) => (
            <Chip
              key={roast}
              href={shopHref(query, { roast: query.roast === roast ? null : roast })}
              active={query.roast === roast}
            >
              {`${label} roast`}
            </Chip>
          ),
        )}
      </div>
    </div>
  );
}
