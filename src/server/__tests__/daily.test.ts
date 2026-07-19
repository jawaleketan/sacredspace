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

const { getMantraOfDay } = await import("../functions/daily");

describe("getMantraOfDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no content exists", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        all: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await getMantraOfDay();

    expect(result).toBeNull();
  });

  it("returns a content item with its deity", async () => {
    const contents = [
      { id: 1, deityId: 1, title: "Ganesha Gayatri", slug: "ganesha-gayatri" },
      { id: 2, deityId: 2, title: "Shiva Tandava", slug: "shiva-tandava" },
    ];
    const deity = { id: 2, name: "Shiva", slug: "shiva" };

    mockDb.select.mockReturnValueOnce({
      from: () => ({
        all: vi.fn().mockResolvedValue(contents),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(deity),
        }),
      }),
    });

    const result = await getMantraOfDay();

    expect(result).not.toBeNull();
    expect(result!.content).toBeDefined();
    expect(result!.deity).toBeDefined();
  });
});
