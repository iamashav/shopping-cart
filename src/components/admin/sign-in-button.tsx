"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { getClientAuth } from "@/lib/firebase/client";

export function SignInButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignIn() {
    setError(null);
    startTransition(async () => {
      const auth = getClientAuth();
      try {
        const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: await user.getIdToken() }),
        });
        // The httpOnly session cookie is the source of truth, so the browser-side Firebase
        // session isn't kept around.
        await signOut(auth);

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ?? "Sign-in failed. Please try again.");
          return;
        }
        router.replace("/admin");
        router.refresh();
      } catch (caught) {
        if (caught instanceof FirebaseError && caught.code === "auth/popup-closed-by-user") return;
        setError("Sign-in failed. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleSignIn} disabled={isPending} className="h-11 w-full text-base">
        {isPending ? "Signing in…" : "Continue with Google"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
