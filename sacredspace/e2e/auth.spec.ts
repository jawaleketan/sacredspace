import { expect, test, type BrowserContext } from "@playwright/test";

// E2E smoke tests for SacredSpace. Targets the local dev server by default;
// CI sets E2E_BASE_URL to the production deployment.
//
// Two layers:
//  1. Unauthenticated canaries — always run (no secrets needed).
//  2. Authenticated flow (sign-in → admin → sign-out) — runs only when the
//     Clerk test-user email + secret key are provided (CI secrets or local
//     exports); otherwise the tests skip themselves and the job stays green.
//
// Why the sign-in is token-based rather than driving the form: Clerk's
// new-device protection sends an email verification code on first sign-in
// from any fresh browser profile, which no automation can read. Instead we
// create a one-time sign-in token via the Clerk Backend API and let the
// app's /sign-in?__clerk_ticket=... route consume it — the documented
// mechanism for establishing a session non-interactively. This still
// exercises the real client session, middleware, and app auth UI.

const EMAIL = process.env.E2E_CLERK_EMAIL;
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const HAS_CREDENTIALS = !!EMAIL && !!SECRET_KEY;
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function createSignInToken(): Promise<string> {
  const lookup = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(EMAIL!)}`,
    { headers: { Authorization: `Bearer ${SECRET_KEY}` } },
  );
  if (!lookup.ok) throw new Error(`Clerk user lookup failed: HTTP ${lookup.status}`);
  const users = (await lookup.json()) as Array<{ id: string }>;
  if (!users.length) throw new Error(`No Clerk user found for ${EMAIL}`);
  const userId = users[0].id;

  const created = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ user_id: userId, expires_in_seconds: "300" }),
  });
  if (!created.ok) throw new Error(`Sign-in token creation failed: HTTP ${created.status}`);
  const token = (await created.json()) as { token: string };
  return token.token;
}

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
  // Serial on purpose: the three steps share one browser context so the
  // session cookie carries (Playwright gives each test a fresh context by
  // default, which would silently sign the flow out between steps).
  test.describe.configure({ mode: "serial" });

  test.skip(!HAS_CREDENTIALS, "E2E_CLERK_EMAIL / CLERK_SECRET_KEY not set");

  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE });
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test("sign-in establishes an authenticated session", async () => {
    const page = await ctx.newPage();
    const token = await createSignInToken();

    // The app's clerkMiddleware consumes the ticket and lands on /.
    // Assert signed-in chrome directly on the redirected page — navigating
    // away mid-handshake aborts the session-token exchange.
    await page.goto(`/sign-in?__clerk_ticket=${token}`);
    await expect(page.locator("[data-testid=user-button]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeHidden();
  });

  test("admin dashboard is accessible when signed in", async () => {
    const page = await ctx.newPage();
    await page.goto("/admin/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Access Denied")).toBeHidden();
  });

  test("sign-out returns to signed-out chrome", async () => {
    const page = await ctx.newPage();
    // UserButton's portal content is opaque; sign out through the menu's
    // "Sign out" action, opening the popover from our stable wrapper first.
    const wb = page.locator("[data-testid=user-button]");
    await page.goto("/");
    await wb.click();
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(wb).toBeHidden({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
