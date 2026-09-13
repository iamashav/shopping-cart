import type { Metadata } from "next";
import { LockIcon } from "lucide-react";
import { SignInButton } from "@/components/admin/sign-in-button";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-sm rounded-xl border bg-card p-8 text-center">
      <LockIcon className="mx-auto size-8 text-brand" />
      <h1 className="mt-4 text-2xl font-semibold">Bloom admin</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Sign in with an approved Google account to manage products and orders.
      </p>
      <SignInButton />
    </section>
  );
}
