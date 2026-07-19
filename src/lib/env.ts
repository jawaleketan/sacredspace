const requiredVars = [
  "VITE_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

const optionalVars = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  for (const key of requiredVars) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
      "Create a .env.local file with these values."
    );
  }
  for (const key of optionalVars) {
    if (!process.env[key]) {
      console.warn(`[env] ${key} not set — using default (local SQLite)`);
    }
  }
}
