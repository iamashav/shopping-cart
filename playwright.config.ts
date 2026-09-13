import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_EMAIL } from "./e2e/admin";

const PORT = 3100;
const isCI = Boolean(process.env.CI);

// Lets tests see local keys (e.g. whether STRIPE_SECRET_KEY is set) the same way `next start` does.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { ADMIN_EMAILS: E2E_ADMIN_EMAIL },
  },
});
