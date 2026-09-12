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
  client: { execute: vi.fn().mockRejectedValue(new Error("no fts in tests")) },
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

const {
  getAllDeities,
  getContent,
  getContentsByDeity,
  searchContents,
  getContentBySlugWithDeity,
  getSiblingContent,
  getDeityBySlug,
  getContentsByDeitySorted,
  buildFtsQuery,
} = await import("../functions/contents");

describe("buildFtsQuery", () => {
  it("quotes and prefix-wraps each term", () => {
    expect(buildFtsQuery("gayatri mantra")).toBe('"gayatri"* "mantra"*');
  });

  it("collapses whitespace and ignores empty terms", () => {
    expect(buildFtsQuery("  om   namah  ")).toBe('"om"* "namah"*');
    expect(buildFtsQuery("   ")).toBe("");
  });

  it("strips embedded double quotes to block FTS syntax injection", () => {
    // Terms keep their original case — inside double quotes FTS5 treats
    // them as literal strings (case-folded by the tokenizer), so "NOT" is
    // a search term, not the boolean operator.
    expect(buildFtsQuery('gay"atri NOT shiva')).toBe('"gayatri"* "NOT"* "shiva"*');
  });
});

describe("getAllDeities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all deities ordered by name", async () => {
    const deities = [
      { id: 1, name: "Ganesha", slug: "ganesha" },
      { id: 2, name: "Shiva", slug: "shiva" },
    ];
    mockDb.select.mockReturnValue({
      from: () => ({
        orderBy: () => ({
          all: vi.fn().mockResolvedValue(deities),
        }),
      }),
    });

    const result = await getAllDeities();

    expect(result).toEqual(deities);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no deities exist", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        orderBy: () => ({
          all: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await getAllDeities();

    expect(result).toEqual([]);
  });
});

describe("getContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns content by slug", async () => {
    const content = { id: 1, slug: "ganesha-gayatri", title: "Ganesha Gayatri" };
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(content),
        }),
      }),
    });

    const result = await getContent({ data: "ganesha-gayatri" });

    expect(result).toEqual(content);
  });

  it("throws when content not found", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    await expect(getContent({ data: "nonexistent" })).rejects.toThrow("Content not found");
  });
});

describe("getContentsByDeity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contents for a deity ordered by title", async () => {
    const contents = [
      { id: 1, deityId: 1, title: "Ganesha Gayatri" },
      { id: 2, deityId: 1, title: "Ganesha Stotram" },
    ];
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue(contents),
          }),
        }),
      }),
    });

    const result = await getContentsByDeity({ data: 1 });

    expect(result).toEqual(contents);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when deity has no contents", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getContentsByDeity({ data: 999 });

    expect(result).toEqual([]);
  });
});

describe("searchContents", () => {
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

  function mockDeityQuery(deity: any) {
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(deity),
        }),
      }),
    });
  }

  it("returns all results when no filters applied", async () => {
    const results = [
      { id: 1, title: "Ganesha Gayatri", slug: "ganesha-gayatri", type: "mantra", deityName: "Ganesha" },
      { id: 2, title: "Shiva Tandava", slug: "shiva-tandava", type: "stotra", deityName: "Shiva" },
    ];
    mockJoinQuery(results);

    const result = await searchContents({
      data: { query: "", sortBy: "alpha" },
    });

    expect(result).toEqual(results);
    expect(result).toHaveLength(2);
  });

  it("filters by query text", async () => {
    const results = [
      { id: 1, title: "Ganesha Gayatri", slug: "ganesha-gayatri", type: "mantra", deityName: "Ganesha" },
    ];
    mockJoinQuery(results);

    const result = await searchContents({
      data: { query: "Ganesha", sortBy: "alpha" },
    });

    expect(result).toEqual(results);
    expect(result).toHaveLength(1);
  });

  it("filters by deity slug", async () => {
    const deity = { id: 2, slug: "shiva" };
    mockDeityQuery(deity);

    const results = [
      { id: 3, title: "Maha Mrityunjaya", slug: "maha-mrityunjaya", type: "mantra", deityName: "Shiva" },
    ];
    mockJoinQuery(results);

    const result = await searchContents({
      data: { query: "", deitySlug: "shiva", sortBy: "alpha" },
    });

    expect(result).toEqual(results);
  });

  it("filters by content type", async () => {
    const results = [
      { id: 1, title: "Ganesha Gayatri", slug: "ganesha-gayatri", type: "mantra", deityName: "Ganesha" },
    ];
    mockJoinQuery(results);

    const result = await searchContents({
      data: { query: "", type: "mantra", sortBy: "alpha" },
    });

    expect(result).toEqual(results);
  });

  it("returns empty when no matches", async () => {
    mockJoinQuery([]);

    const result = await searchContents({
      data: { query: "nonexistent", sortBy: "alpha" },
    });

    expect(result).toEqual([]);
  });

  it("returns empty when deity slug not found", async () => {
    mockDeityQuery(undefined);
    mockJoinQuery([]);

    const result = await searchContents({
      data: { query: "", deitySlug: "nonexistent" },
    });

    expect(result).toEqual([]);
  });
});

describe("getContentBySlugWithDeity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns content joined with deity", async () => {
    const content = { id: 1, slug: "ganesha-gayatri", title: "Ganesha Gayatri", deityId: 1 };
    const deity = { id: 1, name: "Ganesha", slug: "ganesha" };

    // First select call: content by slug -> get()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(content),
        }),
      }),
    });
    // Second select call: deity by id -> get()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(deity),
        }),
      }),
    });

    const result = await getContentBySlugWithDeity({ data: "ganesha-gayatri" });

    expect(result).toEqual({ content, deity });
    expect(result.content.slug).toBe("ganesha-gayatri");
    expect(result.deity?.name).toBe("Ganesha");
  });

  it("throws NotFoundError when content not found", async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    await expect(
      getContentBySlugWithDeity({ data: "nonexistent" }),
    ).rejects.toThrow("Content not found");
  });

  it("returns deity as undefined when deity lookup fails", async () => {
    const content = { id: 1, slug: "orphan", title: "Orphan", deityId: 999 };

    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(content),
        }),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await getContentBySlugWithDeity({ data: "orphan" });

    expect(result.content).toEqual(content);
    expect(result.deity).toBeUndefined();
  });
});

describe("getSiblingContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns published siblings excluding the current slug", async () => {
    const siblings = [
      { id: 2, slug: "ganesha-stotram", title: "Ganesha Stotram", status: "published" },
      { id: 3, slug: "ganesha-atharvashirsha", title: "Ganesha Atharvashirsha", status: "published" },
    ];

    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue(siblings),
          }),
        }),
      }),
    });

    const result = await getSiblingContent({
      data: { deityId: 1, excludeSlug: "ganesha-gayatri" },
    });

    expect(result).toEqual(siblings);
    expect(result).toHaveLength(2);
  });

  it("returns empty when no siblings exist", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getSiblingContent({
      data: { deityId: 1, excludeSlug: "sole-content" },
    });

    expect(result).toEqual([]);
  });
});

describe("getDeityBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deity by slug", async () => {
    const deity = { id: 1, name: "Ganesha", slug: "ganesha", description: "Remover of obstacles" };

    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(deity),
        }),
      }),
    });

    const result = await getDeityBySlug({ data: "ganesha" });

    expect(result).toEqual(deity);
    expect(result.name).toBe("Ganesha");
  });

  it("throws NotFoundError when deity not found", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    await expect(
      getDeityBySlug({ data: "nonexistent" }),
    ).rejects.toThrow("Deity not found");
  });
});

describe("getContentsByDeitySorted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contents sorted by type then title", async () => {
    const contents = [
      { id: 1, deityId: 1, type: "mantra", title: "Gayatri" },
      { id: 2, deityId: 1, type: "mantra", title: "Mahishasura Mardini" },
      { id: 3, deityId: 1, type: "stotra", title: "Lalita Sahasranama" },
    ];

    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue(contents),
          }),
        }),
      }),
    });

    const result = await getContentsByDeitySorted({ data: 1 });

    expect(result).toEqual(contents);
    expect(result).toHaveLength(3);
  });

  it("returns empty when deity has no contents", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getContentsByDeitySorted({ data: 999 });

    expect(result).toEqual([]);
  });
});
