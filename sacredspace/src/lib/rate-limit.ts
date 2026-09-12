/**
 * Fixed-window rate limiter with two interchangeable backends.
 *
 * ── Backend 1: Upstash Redis (durable, default in production) ──────────
 * Enabled when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 * (the standard variable names shown in the Upstash console — copy/paste
 * from the dashboard, no SDK dependency; uses the REST API via fetch).
 * Counters live in Redis, so limits hold across Lambda instances and cold
 * starts. Durable mode FAILS OPEN: if Redis is unreachable or slow (>1s),
 * the in-memory counter takes over for that request and the error is
 * logged — rate limiting is best-effort defense, availability comes first.
 *
 * ── Backend 2: In-memory (fallback) ────────────────────────────────────
 * Counters live in a per-process Map. On serverless platforms every cold
 * start starts empty and warm invocations may hit different instances, so
 * limits are best-effort bursts only. Used automatically when the Upstash
 * variables are unset (e.g. local dev, unit tests).
 *
 * DB-level constraints (unique indexes) remain the ultimate safeguard for
 * data integrity regardless of limiter accuracy.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowEntry>();

// Periodic cleanup of expired entries (runs every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) {
      memoryStore.delete(key);
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
 * Durable-backend configuration, resolved per call (env vars are static in
 * serverless runtimes; resolving lazily also keeps unit tests simple).
 */
function durableConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/** One warning per process when the durable backend misbehaves. */
let warnedDurableFailure = false;

const UPSTASH_TIMEOUT_MS = 1_000;

/**
 * Fixed-window check against Upstash over its REST API (no SDK).
 * Pipeline: INCR → EXPIRE NX (ttl only when newly created) → PTTL.
 */
async function upstashCheck(url: string, token: string, key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSec), "NX"],
      ["PTTL", redisKey],
    ]),
  });
  if (!response.ok) {
    throw new Error(`Upstash REST responded ${response.status}`);
  }
  const payload = (await response.json()) as { result?: unknown }[];
  const count = Number(payload[0]?.result ?? 0);
  const pttl = Number(payload[2]?.result ?? -1);

  const now = Date.now();
  // pttl is ms remaining; -2 (missing key) / -1 (no expiry) → assume a fresh window
  const resetAt = now + (pttl > 0 ? pttl : config.windowMs);
  const allowed = count <= config.maxRequests;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - count),
    retryAfterMs: allowed ? 0 : Math.max(1, resetAt - now),
  };
}

/**
 * Fixed-window check against the per-process Map.
 */
function memoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start new window
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
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

/**
 * Check rate limit for a given key. Returns whether the request is allowed.
 *
 * Async because the durable backend (Upstash) is a network call. When the
 * durable backend is unconfigured or failing, falls back to the in-memory
 * counter (fail-open — a limiter outage must not take the API down).
 *
 * @param key - Unique identifier (e.g. session ID, user ID, IP)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const durable = durableConfig();
  if (durable) {
    try {
      return await upstashCheck(durable.url, durable.token, key, config);
    } catch (e) {
      if (!warnedDurableFailure) {
        warnedDurableFailure = true;
        console.error("Durable rate limiter unavailable — falling back to in-memory counters", e);
      }
    }
  }
  return memoryCheck(key, config);
}

import { RateLimitError } from "~/lib/errors";

/**
 * Throw an error if rate limit is exceeded. Call this before executing
 * the protected operation. (Await it — see checkRateLimit.)
 */
export async function enforceRateLimit(key: string, config: RateLimitConfig): Promise<void> {
  const result = await checkRateLimit(key, config);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterMs);
  }
}
