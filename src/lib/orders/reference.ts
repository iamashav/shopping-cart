import { createHash } from "node:crypto";

// Derived from the Stripe session id so the success page can show it before the webhook has run.
export function orderReference(sessionId: string): string {
  const hash = createHash("sha256").update(sessionId).digest("hex").slice(0, 8).toUpperCase();
  return `BLM-${hash}`;
}

export const ORDER_REFERENCE_PATTERN = /^BLM-[0-9A-F]{8}$/;
