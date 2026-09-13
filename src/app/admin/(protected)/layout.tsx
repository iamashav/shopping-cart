import { Suspense } from "react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { requireAdmin } from "@/lib/auth/session";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-brand uppercase">Admin</p>
          <p className="text-sm text-muted-foreground">Signed in as {admin.email}</p>
        </div>
        <SignOutButton />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
