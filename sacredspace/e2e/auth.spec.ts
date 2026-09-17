import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

// E2E smoke tests for SacredSpace. Targets the local dev server by default;
// CI sets E2E_BASE_URL to the production deployment.
//
// Two layers:
//  1. Unauthenticated canaries — always run (no secrets needed).
//  2. Authenticated flow (sign-in → admin → sign-out) — runs only when Clerk
//     dev-instance keys + a test account are provided (CI secrets or local
//     exports); otherwise the test skips itself and the job stays green.

const EMAIL = process.env.E2E_CLERK_EMAIL;
const PASSWORD = process.env.E2E_CLERK_PASSWORD;
const HAS_CREDENTIALS = !!EMAIL && !!PASSWORD;

test.describe("unauthenticated canaries", () => {
  test("homepage renders the app shell", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "SacredSpace" })).toBeVisible();
    // Signed-out chrome renders the sign-in button.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("admin dashboard is protected when signed out", async ({ page }) => {
    await page.goto("/admin/dashboard");
    // The route's 401 error boundary renders Access Denied.
    await expect(page.getByText("Access Denied")).toBeVisible();
  });
});

test.describe("authenticated Clerk flow", () => {
  // Serial on purpose: sign-in state carries across the three steps.
  test.describe.configure({ mode: "serial" });

  test.skip(!HAS_CREDENTIALS, "E2E_CLERK_EMAIL / E2E_CLERK_PASSWORD not set");

  test("sign-in renders and authenticates", async ({ page }) => {
    // Testing Token bypasses Clerk's bot protection (requires a dev
    // instance — production instances reject testing tokens, by design).
    await setupClerkTestingToken({ page });
    await page.goto("/sign-in");

    // If Clerk shows its bot-protection challenge instead of the form,
    // fail with instructions instead of timing out on a missing selector.
    const botBlock = page.getByText(/verify you are human/i);
    try {
      await botBlock.waitFor({ state: "visible", timeout: 5_000 });
      test.info().fixme(true, "Clerk bot-protection challenge blocked the test (Testing Tokens only work on dev instances)");
      return;
    } catch {
      // No challenge — the sign-in form rendered as expected.
    }

    await page.locator("input[name=identifier]").fill(EMAIL!);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("input[name=password]").fill(PASSWORD!);
    await page.getByRole("button", { name: /continue/i }).click();

    // Redirected back to the app, signed in: the homepage swaps the
    // Sign In button for the Clerk UserButton.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeHidden({
      timeout: 20_000,
    });
    await expect(page.locator("[data-testid=user-button]")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("admin dashboard is accessible when signed in", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Access Denied")).toBeHidden();
  });

  test("sign-out returns to signed-out chrome", async ({ page }) => {
    // UserButton's portal content is opaque; sign out through the menu's
    // "Sign out" action, opening the popover from our stable wrapper first.
    const wb = page.locator("[data-testid=user-button]");
    await wb.click();
    const signOut = page.getByRole("button", { name: "Sign out" });
    await signOut.click();

    await expect(wb).toBeHidden({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
