/**
 * Sliding window rate limiter.
 *
 * ⚠️  IMPORTANT LIMITATION — IN-MEMORY STORAGE
 * ─────────────────────────────────────────────────────────────
 * Counters live in a per-process Map. On serverless platforms (Vercel
 * Lambdas) every cold start starts with an empty Map, and warm invocations
 * may run on different instances, so limits are best-effort:
 *
 *   - protects against rapid-fire bursts within one warm instance
 *   - does NOT provide a hard global cap across instances
 *
 * For a hard global limit, back this with a shared store (Upstash Redis,
 * Vercel KV) — swap out the store inside `checkRateLimit`; the
 * `enforceRateLimit` call sites stay unchanged.
 *
 * DB-level constraints (unique indexes) provide the ultimate safeguard
 * for data integrity regardless of this limiter's accuracy.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Periodic cleanup of expired entries (runs every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000).unref?.();

/**
 * Resolve the TanStack Start server module once per process.
 *
 * Lazy dynamic import (instead of a top-level static import or a CJS
 * require()) because:
 *   - the package is ESM-only, so require() is unavailable
 *   - keeping it out of the module graph of client-shared code avoids
 *     bundling server-only internals on the client
 */
const serverModulePromise: Promise<{
  getRequestHeader: (name: string) => string | undefined;
}> = import("@tanstack/react-start/server").catch(() => null as never);

/**
 * Extract client IP from the x-forwarded-for header (set by Vercel /
 * Cloudflare / reverse proxies). Falls back to "anonymous" for local dev
 * and unit tests where no request context exists.
 *
 * Async because the server module (and the request async-context it reads)
 * resolves via dynamic import; all call sites are already inside async
 * server-function handlers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const mod = await serverModulePromise;
    if (!mod?.getRequestHeader) return "anonymous";
    const forwarded = mod.getRequestHeader("x-forwarded-for");
    if (forwarded) {
      // x-forwarded-for can be "client, proxy1, proxy2" — take the first
      return forwarded.split(",")[0].trim();
    }
  } catch {
    // No active request context (e.g. unit tests) — fall back
  }
  return "anonymous";
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check rate limit for a given key. Returns whether the request is allowed.
 *
 * @param key - Unique identifier (e.g. session ID, user ID, IP)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start new window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Within limit — increment
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterMs: 0 };
}

import { RateLimitError } from "~/lib/errors";

/**
 * Throw an error if rate limit is exceeded. Call this before executing
 * the protected operation.
 */
export function enforceRateLimit(key: string, config: RateLimitConfig): void {
  const result = checkRateLimit(key, config);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterMs);
  }
}