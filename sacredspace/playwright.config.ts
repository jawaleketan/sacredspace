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
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  // Clerk components hydrate async and prod cold-starts can be slow.
  expect: { timeout: 15_000 },
  projects: [
    // Clerk's testing package requires a *project-based* setup (not a
    // function-style globalSetup): clerkSetup() sets CLERK_FAPI and
    // CLERK_TESTING_TOKEN for downstream workers, and those only propagate
    // through project dependencies.
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
    },
  ],
});
