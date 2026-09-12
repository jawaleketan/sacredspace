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

vi.mock("~/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

const mockDb = {
  select: vi.fn(),
};

vi.mock("../db", () => ({
  db: mockDb,
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

const { getMantraOfDay } = await import("../functions/daily");

describe("getMantraOfDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no published content exists", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ c: 0 }),
        }),
      }),
    });

    const result = await getMantraOfDay();

    expect(result).toBeNull();
  });

  it("returns a published content item with its deity", async () => {
    const row = {
      id: 1, deityId: 1, type: "mantra", title: "Ganesha Gayatri",
      slug: "ganesha-gayatri", status: "published", body: "<p>Om</p>",
      transliteration: "", translation: "", description: "",
      audioUrl: null, createdAt: "", updatedAt: "",
      deityName: "Ganesha", deitySlug: "ganesha",
      deityDescription: "Remover of obstacles", deityImageUrl: null,
    };

    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            get: vi.fn().mockResolvedValue({ c: 5 }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => ({
                  offset: () => ({
                    get: vi.fn().mockResolvedValue(row),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

    const result = await getMantraOfDay();

    expect(result).not.toBeNull();
    expect(result!.content).toBeDefined();
    expect(result!.content.title).toBe("Ganesha Gayatri");
    expect(result!.content.status).toBe("published");
    expect(result!.deity).toBeDefined();
    expect(result!.deity.name).toBe("Ganesha");
  });
});