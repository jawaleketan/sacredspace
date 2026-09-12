import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

const { checkRateLimit, enforceRateLimit } = await import("../rate-limit");
const { RateLimitError } = await import("~/lib/errors");

const CONFIG = { maxRequests: 3, windowMs: 60_000 };

function mockUpstash(results: [number, unknown, number][]) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(results.map(([, result]) => ({ result }))),
  });
}

function withDurable<T>(fn: () => Promise<T>): Promise<T> {
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  return fn();
}

describe("checkRateLimit — Upstash backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("uses the Upstash REST API when configured", async () => {
    await withDurable(async () => {
      mockUpstash([
        [0, 2, 30_000], // INCR → 2
        [1, 1, 30_000], // EXPIRE NX
        [2, 30_000, 30_000], // PTTL → 30s left
      ]);

      const result = await checkRateLimit("k1", CONFIG);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 3 - 2
      expect(mockFetch).toHaveBeenCalledOnce();
      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual([
        ["INCR", "ratelimit:k1"],
        ["EXPIRE", "ratelimit:k1", "60", "NX"],
        ["PTTL", "ratelimit:k1"],
      ]);
    });
  });

  it("blocks when the window count exceeds maxRequests", async () => {
    await withDurable(async () => {
      mockUpstash([
        [0, 5, 10_000],
        [1, 1, 10_000],
        [2, 10_000, 10_000],
      ]);

      const result = await checkRateLimit("k2", CONFIG);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });
  });

  it("fails open to the memory backend when Upstash errors", async () => {
    await withDurable(async () => {
      mockFetch.mockRejectedValue(new Error("redis down"));

      // Memory limiter: first call allowed
      const result = await checkRateLimit("k3", CONFIG);
      expect(result.allowed).toBe(true);
    });
  });

  it("fails open when Upstash responds non-OK", async () => {
    await withDurable(async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 503 });

      const result = await checkRateLimit("k4", CONFIG);
      expect(result.allowed).toBe(true);
    });
  });
});

describe("checkRateLimit — memory backend (durable unconfigured)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows up to maxRequests then blocks with retryAfterMs", async () => {
    expect((await checkRateLimit("mem", CONFIG)).allowed).toBe(true);
    expect((await checkRateLimit("mem", CONFIG)).allowed).toBe(true);
    expect((await checkRateLimit("mem", CONFIG)).allowed).toBe(true);
    const blocked = await checkRateLimit("mem", CONFIG);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it("tracks keys independently", async () => {
    expect((await checkRateLimit("a", CONFIG)).allowed).toBe(true);
    expect((await checkRateLimit("b", CONFIG)).allowed).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("resolves when allowed", async () => {
    await expect(enforceRateLimit("ok", CONFIG)).resolves.toBeUndefined();
  });

  it("throws RateLimitError when blocked", async () => {
    for (let i = 0; i < CONFIG.maxRequests; i++) {
      await enforceRateLimit("blocked", CONFIG);
    }
    await expect(enforceRateLimit("blocked", CONFIG)).rejects.toThrow(RateLimitError);
  });
});
