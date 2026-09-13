import "server-only";
import type { DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { orderSchema, type Order } from "./schema";

export function parseOrder(data: DocumentData | undefined): Order | null {
  if (!data) return null;
  const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;
  const parsed = orderSchema.safeParse({ ...data, createdAt });
  return parsed.success ? parsed.data : null;
}

export async function findOrderByReference(
  reference: string,
  email: string,
): Promise<Order | null> {
  const snapshot = await db.collection("orders").where("reference", "==", reference).limit(1).get();
  const order = parseOrder(snapshot.docs[0]?.data());
  // Same null result for "no such order" and "wrong email" so references can't be probed.
  return order && order.emailLower === email.trim().toLowerCase() ? order : null;
}
