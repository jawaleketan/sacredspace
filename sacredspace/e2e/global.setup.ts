import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });

setup("global setup", async () => {
  // The authenticated-flow test skips when Clerk keys aren't provided
  // (they only exist as CI secrets / local exports). Skip the setup too so
  // clerkSetup() doesn't fail the whole suite in that case.
  setup.skip(
    !process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY,
    "Clerk keys not configured — authenticated-flow tests will skip",
  );
  await clerkSetup();
});
