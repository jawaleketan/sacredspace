export function validateEnv(): void {
  if (typeof document !== "undefined") return;
  const missing: string[] = [];
  if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    missing.push("VITE_CLERK_PUBLISHABLE_KEY");
  }
  if (!process.env.CLERK_SECRET_KEY) {
    missing.push("CLERK_SECRET_KEY");
  }
  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(", ")}.\nCreate a .env.local file with these values.`;
    if (process.env.NODE_ENV === "development") {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }
}
