"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/admin/session", { method: "DELETE" });
          router.replace("/admin/login");
          router.refresh();
        })
      }
    >
      <LogOutIcon data-icon="inline-start" />
      Sign out
    </Button>
  );
}
