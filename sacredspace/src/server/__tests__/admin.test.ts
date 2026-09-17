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
  clerkClient: vi.fn(() => ({
    users: { getUser: vi.fn().mockResolvedValue({ publicMetadata: { role: "admin" } }) },
  })),
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../db", () => ({
  db: mockDb,
  ensureSeeded: vi.fn().mockResolvedValue(undefined),
}));

const { createContent, updateContent, deleteContent, toggleContentStatus, getAllContents } = await import("../functions/admin");

function mockNoSlugClash() {
  mockDb.select.mockReturnValue({
    from: () => ({
      where: () => ({
        get: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  });
}

describe("getAllContents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a paginated page of items", async () => {
    // First select: count; second select: page items
    const items = [{ id: 1, title: "A", slug: "a", type: "mantra", status: "published", deityId: 1, deityName: "Ganesha", deitySlug: "ganesha", createdAt: "", updatedAt: "" }];
    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          get: vi.fn().mockResolvedValue({ count: 1 }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: () => ({
                  all: vi.fn().mockResolvedValue(items),
                }),
              }),
            }),
          }),
        }),
      });

    const result = await getAllContents({ data: { page: 1 } });

    expect(result.items).toEqual(items);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(getAllContents({ data: { page: 1 } })).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });

  it("throws ForbiddenError when signed in without the admin role", async () => {
    const { clerkClient } = await import("@clerk/tanstack-react-start/server");
    (clerkClient as any).mockReturnValueOnce({
      users: { getUser: vi.fn().mockResolvedValue({ publicMetadata: {} }) },
    });

    await expect(getAllContents({ data: { page: 1 } })).rejects.toThrow("Admin access required");
  });
});

describe("createContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates content with sanitized body", async () => {
    mockNoSlugClash();
    const created = { id: 1, title: "Test Mantra", slug: "test-mantra", body: "<p>Safe content</p>" };
    mockDb.insert.mockReturnValue({
      values: () => ({
        returning: () => ({
          get: vi.fn().mockResolvedValue(created),
        }),
      }),
    });

    const result = await createContent({
      data: {
        deityId: 1,
        type: "mantra",
        title: "Test Mantra",
        slug: "test-mantra",
        body: "<p>Safe content</p>",
        status: "published",
      },
    });

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("throws ConflictError when the slug already exists", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ id: 42 }),
        }),
      }),
    });

    await expect(
      createContent({
        data: {
          deityId: 1,
          type: "mantra",
          title: "Dup",
          slug: "test-mantra",
          body: "x",
          status: "published",
        },
      }),
    ).rejects.toThrow("already exists");

    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("sanitizes script tags from body", async () => {
    mockNoSlugClash();
    const created = { id: 1, title: "XSS Test", slug: "xss-test", body: "Safe content" };
    mockDb.insert.mockReturnValue({
      values: () => ({
        returning: () => ({
          get: vi.fn().mockResolvedValue(created),
        }),
      }),
    });

    const result = await createContent({
      data: {
        deityId: 1,
        type: "mantra",
        title: "XSS Test",
        slug: "xss-test",
        body: "<p>Safe content</p><script>alert('xss')</script>",
        status: "published",
      },
    });

    expect(result).toBeDefined();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(
      createContent({
        data: {
          deityId: 1,
          type: "mantra",
          title: "Test",
          slug: "test",
          body: "test",
          status: "published",
        },
      }),
    ).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("updateContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates content with sanitized body", async () => {
    // Slug check passes (no clash excluding own id)
    mockNoSlugClash();
    const updated = { id: 1, title: "Updated Title", slug: "updated-title" };
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => ({
            get: vi.fn().mockResolvedValue(updated),
          }),
        }),
      }),
    });

    const result = await updateContent({
      data: {
        id: 1,
        deityId: 1,
        type: "mantra",
        title: "Updated Title",
        slug: "updated-title",
        body: "<p>Updated content</p>",
        status: "published",
      },
    });

    expect(result).toEqual(updated);
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(
      updateContent({
        data: {
          id: 1,
          deityId: 1,
          type: "mantra",
          title: "Test",
          slug: "test",
          body: "test",
          status: "published",
        },
      }),
    ).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("deleteContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes content and its likes", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockDb.delete.mockReturnValue({
      where: () => ({ run }),
    });

    const result = await deleteContent({ data: 1 });

    expect(result).toEqual({ deleted: true });
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(deleteContent({ data: 1 })).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("toggleContentStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles from published to draft", async () => {
    const item = { id: 1, status: "published" };
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(item),
        }),
      }),
    });
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          run: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await toggleContentStatus({ data: 1 });

    expect(result).toEqual({ status: "draft" });
  });

  it("toggles from draft to published", async () => {
    const item = { id: 1, status: "draft" };
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(item),
        }),
      }),
    });
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          run: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await toggleContentStatus({ data: 1 });

    expect(result).toEqual({ status: "published" });
  });

  it("throws when content not found", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    await expect(toggleContentStatus({ data: 999 })).rejects.toThrow("Content not found");
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(toggleContentStatus({ data: 1 })).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});
