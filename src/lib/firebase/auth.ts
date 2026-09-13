import "server-only";
import { getAuth } from "firebase-admin/auth";
import { app } from "./db";

// Kept separate from ./admin so Firestore-only code (checkout, webhook, catalog) never loads the
// Auth SDK and its token-verification dependencies.
export const adminAuth = getAuth(app);
