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

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: vi.fn(() => "test-session-id"),
  setCookie: vi.fn(),
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../db", () => ({
  db: mockDb,
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

const { toggleLike, getLikeStatus, getLikeCount } = await import("../functions/likes");

describe("toggleLike", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockQuery() {
    const get = vi.fn();
    const run = vi.fn();
    mockDb.select.mockReturnValue({ from: () => ({ where: () => ({ get }) }) });
    mockDb.insert.mockReturnValue({ values: () => ({ returning: () => ({ get: vi.fn() }), run }) });
    mockDb.delete.mockReturnValue({ where: () => ({ run }) });
    return { get, run };
  }

  it("creates a like when none exists", async () => {
    const { get, run } = mockQuery();
    get.mockResolvedValueOnce(undefined);
    run.mockResolvedValueOnce(undefined);

    const result = await toggleLike({ data: 1 });

    expect(result.liked).toBe(true);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("removes a like when one already exists", async () => {
    const { get, run } = mockQuery();
    get.mockResolvedValueOnce({ id: 42, contentId: 1, sessionId: "test" });
    run.mockResolvedValueOnce(undefined);

    const result = await toggleLike({ data: 1 });

    expect(result.liked).toBe(false);
    expect(mockDb.delete).toHaveBeenCalledOnce();
  });
});

describe("getLikeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns liked=true when a like exists", async () => {
    const get = vi.fn().mockResolvedValue({ id: 1 });
    mockDb.select.mockReturnValue({ from: () => ({ where: () => ({ get }) }) });

    const result = await getLikeStatus({ data: 1 });

    expect(result.liked).toBe(true);
  });

  it("returns liked=false when no like exists", async () => {
    const get = vi.fn().mockResolvedValue(undefined);
    mockDb.select.mockReturnValue({ from: () => ({ where: () => ({ get }) }) });

    const result = await getLikeStatus({ data: 1 });

    expect(result.liked).toBe(false);
  });
});

describe("getLikeCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the count of likes", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ count: 5 }),
        }),
      }),
    });

    const result = await getLikeCount({ data: 1 });

    expect(result).toBe(5);
  });

  it("returns 0 when no likes exist", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
    });

    const result = await getLikeCount({ data: 1 });

    expect(result).toBe(0);
  });
});
