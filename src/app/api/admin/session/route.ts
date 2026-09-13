import { cookies } from "next/headers";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  getAdmin,
} from "@/lib/auth/session";
import { adminAuth } from "@/lib/firebase/admin";

const bodySchema = z.object({ idToken: z.string().min(1).max(5000) });

// Session changes must come from our own pages, not a form on another site.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const result = await createAdminSession(body.data.idToken);
  if (!result.ok) return Response.json({ error: result.message }, { status: result.status });

  (await cookies()).set(SESSION_COOKIE, result.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const admin = await getAdmin();
  if (admin) await adminAuth.revokeRefreshTokens(admin.uid);
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
