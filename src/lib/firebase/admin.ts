import "server-only";

// App code imports from here so the service account can never reach a client bundle;
// scripts (e.g. the seed) import ./db directly because "server-only" throws outside Next.
export { adminAuth, db } from "./db";
