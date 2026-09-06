import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let _handler: any;
    const wrapper = (opts: any) => _handler(opts);
    wrapper.validator = () => wrapper;
    wrapper.handler = (h: any) => { _handler = h; return wrapper; };
    return wrapper;
  },
}));

const mockDb = {
  select: vi.fn(),
};

vi.mock("../db", () => ({
  db: mockDb,
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const { getSavedContents } = await import("../functions/saved");

describe("getSavedContents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockJoinQuery(results: any[]) {
    mockDb.select.mockReturnValue({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue(results),
            }),
          }),
        }),
      }),
    });
  }

  it("returns empty array when no IDs provided", async () => {
    const result = await getSavedContents({ data: [] });

    expect(result).toEqual([]);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("returns saved contents by IDs", async () => {
    const results = [
      { id: 1, title: "Ganesha Gayatri", slug: "ganesha-gayatri", type: "mantra", description: "", deityName: "Ganesha", deitySlug: "ganesha" },
      { id: 3, title: "Maha Mrityunjaya", slug: "maha-mrityunjaya", type: "mantra", description: "", deityName: "Shiva", deitySlug: "shiva" },
    ];
    mockJoinQuery(results);

    const result = await getSavedContents({ data: [1, 3] });

    expect(result).toEqual(results);
    expect(result).toHaveLength(2);
  });

  it("returns empty when no matching contents", async () => {
    mockJoinQuery([]);

    const result = await getSavedContents({ data: [999] });

    expect(result).toEqual([]);
  });

  it("enforces rate limiting", async () => {
    mockJoinQuery([]);

    await getSavedContents({ data: [1] });

    const { enforceRateLimit } = await import("~/lib/rate-limit");
    expect(enforceRateLimit).toHaveBeenCalledOnce();
  });
});
