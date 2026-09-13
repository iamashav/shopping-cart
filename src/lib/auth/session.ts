import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/auth";
import { isAdminEmail, parseAdminEmails } from "./admin-emails";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./cookie";

export { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS };
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60;

export type Admin = { uid: string; email: string };

function allowlist() {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}

export type SessionResult =
  { ok: true; cookie: string } | { ok: false; status: 401 | 403; message: string };

export async function createAdminSession(idToken: string): Promise<SessionResult> {
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return { ok: false, status: 401, message: "Sign-in could not be verified." };
  }

  // Only mint a long-lived session from a sign-in that just happened, so a stolen old ID token
  // can't be exchanged for a cookie.
  if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_SECONDS) {
    return { ok: false, status: 401, message: "Please sign in again." };
  }

  if (!isAdminEmail(decoded.email, decoded.email_verified, allowlist())) {
    return { ok: false, status: 403, message: "This Google account isn't an admin." };
  }

  const cookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
  return { ok: true, cookie };
}

export async function getAdmin(): Promise<Admin | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    // The allowlist is re-checked on every request so removing an email revokes access immediately.
    if (!isAdminEmail(decoded.email, decoded.email_verified, allowlist())) return null;
    return { uid: decoded.uid, email: decoded.email! };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
