import { defineConfig } from "@playwright/test";

// Target: the running dev server by default, or override with E2E_BASE_URL
// (CI points this at the production deployment for post-deploy smoke tests).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 60_000,
  // Prod cold starts are slow; a 5s default expect timeout flaked a canary.
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
});
