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

vi.mock("@clerk/tanstack-react-start/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_test123" }),
}));

const mockDb = {
  select: vi.fn(),
};

vi.mock("../db", () => ({
  db: mockDb,
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

const { getAnalytics } = await import("../functions/analytics");

function mockCountQuery(count: number) {
  return {
    from: () => ({
      where: () => ({
        get: vi.fn().mockResolvedValue({ count }),
      }),
      get: vi.fn().mockResolvedValue({ count }),
    }),
  };
}

function mockJoinChainQuery(results: any[]) {
  return {
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          groupBy: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue(results),
            }),
          }),
        }),
        groupBy: () => ({
          orderBy: () => ({
            all: vi.fn().mockResolvedValue(results),
          }),
        }),
      }),
      leftJoin: () => ({
        leftJoin: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: () => ({
                all: vi.fn().mockResolvedValue(results),
              }),
              all: vi.fn().mockResolvedValue(results),
            }),
          }),
        }),
        groupBy: () => ({
          orderBy: () => ({
            limit: () => ({
              all: vi.fn().mockResolvedValue(results),
            }),
            all: vi.fn().mockResolvedValue(results),
          }),
        }),
      }),
      groupBy: () => ({
        orderBy: () => ({
          all: vi.fn().mockResolvedValue(results),
        }),
      }),
    }),
  };
}

describe("getAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(getAnalytics()).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });

  it("returns analytics with totals", async () => {
    // Mock all the chained queries: 4 count queries, then 5 join queries, then 2 groupBy queries
    mockDb.select
      // totalItems
      .mockReturnValueOnce(mockCountQuery(10))
      // totalLikes
      .mockReturnValueOnce(mockCountQuery(25))
      // publishedCount
      .mockReturnValueOnce(mockCountQuery(8))
      // draftsCount
      .mockReturnValueOnce(mockCountQuery(2))
      // likesPerContent
      .mockReturnValueOnce(mockJoinChainQuery([
        { contentId: 1, count: 5, title: "Gayatri", slug: "gayatri", type: "mantra", deityName: "Surya" },
      ]))
      // mostActiveDeities
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              groupBy: () => ({
                orderBy: () => ({
                  limit: () => ({
                    all: vi.fn().mockResolvedValue([
                      { deityId: 1, deityName: "Ganesha", deitySlug: "ganesha", contentCount: 3, totalLikes: 10 },
                    ]),
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      // contentByDeity
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              groupBy: () => ({
                orderBy: () => ({
                  all: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      })
      // recentContent
      .mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            leftJoin: () => ({
              groupBy: () => ({
                orderBy: () => ({
                  limit: () => ({
                    all: vi.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      // contentTypeStatsRaw
      .mockReturnValueOnce({
        from: () => ({
          groupBy: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue([
                { type: "mantra", count: 7 },
                { type: "stotra", count: 3 },
              ]),
            }),
          }),
        }),
      })
      // contentStatusStatsRaw
      .mockReturnValueOnce({
        from: () => ({
          groupBy: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue([
                { status: "published", count: 8 },
                { status: "draft", count: 2 },
              ]),
            }),
          }),
        }),
      });

    const result = await getAnalytics();

    expect(result.totals).toEqual({
      totalItems: 10,
      totalLikes: 25,
      publishedCount: 8,
      draftsCount: 2,
    });
  });

  it("computes correct percentage for content type stats", async () => {
    mockDb.select
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockJoinChainQuery([]))
      .mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ leftJoin: () => ({ groupBy: () => ({ orderBy: () => ({ limit: () => ({ all: vi.fn().mockResolvedValue([]) }) }) }) }) }) }) })
      .mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ leftJoin: () => ({ groupBy: () => ({ orderBy: () => ({ all: vi.fn().mockResolvedValue([]) }) }) }) }) }) })
      .mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ leftJoin: () => ({ groupBy: () => ({ orderBy: () => ({ limit: () => ({ all: vi.fn().mockResolvedValue([]) }) }) }) }) }) }) })
      // contentTypeStatsRaw: 3 mantras, 1 stotra
      .mockReturnValueOnce({
        from: () => ({
          groupBy: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue([
                { type: "mantra", count: 3 },
                { type: "stotra", count: 1 },
              ]),
            }),
          }),
        }),
      })
      // contentStatusStatsRaw
      .mockReturnValueOnce({
        from: () => ({
          groupBy: () => ({
            orderBy: () => ({
              all: vi.fn().mockResolvedValue([
                { status: "published", count: 4 },
              ]),
            }),
          }),
        }),
      });

    const result = await getAnalytics();

    expect(result.contentTypeStats).toEqual([
      { type: "mantra", count: 3, percentage: 75 },
      { type: "stotra", count: 1, percentage: 25 },
    ]);
    expect(result.contentStatusStats).toEqual([
      { status: "published", count: 4, percentage: 100 },
    ]);
  });
});
