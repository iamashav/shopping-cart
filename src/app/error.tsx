"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-4xl font-semibold">Something spilled</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t load this page. It&apos;s usually temporary, so try again in a moment.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="h-10 px-5">
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
          Go home
        </Link>
      </div>
    </section>
  );
}
