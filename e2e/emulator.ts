import { expect, type Page, type TestInfo } from "@playwright/test";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { E2E_ADMIN_EMAIL } from "./admin";

const PASSWORD = "e2e-only-password";

export const emulatorsRunning = () =>
  Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

// Same "demo-" project the app uses under the emulators, so this can never reach real Firebase.
function app() {
  return getApps()[0] ?? initializeApp({ projectId: "demo-bloom" });
}

export const testDb = () => getFirestore(app());

export async function signInAsAdmin(page: Page, testInfo: TestInfo) {
  const auth = getAuth(app());
  try {
    await auth.createUser({ email: E2E_ADMIN_EMAIL, password: PASSWORD, emailVerified: true });
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/email-already-exists") throw error;
  }

  const signIn = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: E2E_ADMIN_EMAIL, password: PASSWORD, returnSecureToken: true }),
    },
  );
  const { idToken } = (await signIn.json()) as { idToken: string };

  const baseURL = testInfo.project.use.baseURL!;
  const session = await page.request.post("/api/admin/session", {
    headers: { Origin: baseURL },
    data: { idToken },
  });
  expect(session.status()).toBe(200);
}
