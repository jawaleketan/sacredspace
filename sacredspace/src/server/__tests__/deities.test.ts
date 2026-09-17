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

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, writeFile: vi.fn().mockResolvedValue(undefined), mkdir: vi.fn().mockResolvedValue(undefined) };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, existsSync: vi.fn().mockReturnValue(true) };
});

vi.mock("~/lib/upload", () => ({
  validateImageUpload: vi.fn().mockReturnValue({ buffer: Buffer.from("fake"), ext: "png", mime: "image/png" }),
  generateUploadName: vi.fn().mockReturnValue("deity-abc123.png"),
}));

vi.mock("~/lib/storage", () => ({
  storeFile: vi.fn().mockResolvedValue({ url: "/uploads/deity-abc123.png", storage: "local" }),
  deleteStoredFile: vi.fn().mockResolvedValue(undefined),
}));

const { updateDeityImage, updateDeity, removeDeityImage, deleteDeity, createDeity } = await import("../functions/deities");

describe("createDeity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockNoSlugClash() {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });
  }

  it("creates a deity and returns the result", async () => {
    const created = { id: 1, name: "Krishna", slug: "krishna", description: "" };
    mockNoSlugClash();
    mockDb.insert.mockReturnValue({
      values: () => ({
        returning: () => ({
          get: vi.fn().mockResolvedValue(created),
        }),
      }),
    });

    const result = await createDeity({
      data: { name: "Krishna", slug: "krishna", description: "" },
    });

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("throws ConflictError when the slug is already taken", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ id: 99 }),
        }),
      }),
    });

    await expect(
      createDeity({ data: { name: "Duplicate", slug: "krishna", description: "" } }),
    ).rejects.toThrow("already exists");

    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(
      createDeity({ data: { name: "Krishna", slug: "krishna", description: "" } }),
    ).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("updateDeity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a deity", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    // No slug clash (slug check runs before update)
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ run }),
      }),
    });

    const result = await updateDeity({
      data: { id: 1, name: "Shiva", slug: "shiva", description: "The destroyer" },
    });

    expect(result).toEqual({ ok: true });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("throws ConflictError when renaming to an existing slug", async () => {
    // Slug belongs to a different deity (id 2)
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue({ id: 2 }),
        }),
      }),
    });

    await expect(
      updateDeity({ data: { id: 1, name: "Shiva", slug: "krishna", description: "" } }),
    ).rejects.toThrow("already exists");

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(
      updateDeity({ data: { id: 1, name: "Shiva", slug: "shiva", description: "" } }),
    ).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("removeDeityImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockNoExistingImage() {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });
  }

  it("sets imageUrl to null", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockNoExistingImage();
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ run }),
      }),
    });

    const result = await removeDeityImage({ data: 1 });

    expect(result).toEqual({ ok: true });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(removeDeityImage({ data: 1 })).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("updateDeityImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves image and returns imageUrl", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    // Previous-image lookup (none found)
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          get: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ run }),
      }),
    });

    const result = await updateDeityImage({
      data: { deityId: 1, imageBase64: "aW1hZ2VkYXRh", fileName: "ganesha.png" },
    });

    expect(result).toEqual({ imageUrl: "/uploads/deity-abc123.png" });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(
      updateDeityImage({ data: { deityId: 1, imageBase64: "data", fileName: "x.png" } }),
    ).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });
});

describe("deleteDeity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes deity with related contents and likes", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    // First select: deity row; second: related contents
    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            get: vi.fn().mockResolvedValue({ imageUrl: "/uploads/deity-abc123.png" }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            all: vi.fn().mockResolvedValue([{ id: 10, audioUrl: null }, { id: 20, audioUrl: null }]),
          }),
        }),
      });
    mockDb.delete.mockReturnValue({
      where: () => ({ run }),
    });

    const result = await deleteDeity({ data: 1 });

    expect(result).toEqual({ deleted: true });
    // 3 deletes: likes, contents, deity
    expect(mockDb.delete).toHaveBeenCalledTimes(3);
  });

  it("deletes deity with no related contents", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            get: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            all: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
    mockDb.delete.mockReturnValue({
      where: () => ({ run }),
    });

    const result = await deleteDeity({ data: 1 });

    expect(result).toEqual({ deleted: true });
    // Only 1 delete: the deity itself
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it("throws when not authenticated", async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    (auth as any).mockResolvedValueOnce({ userId: null });

    await expect(deleteDeity({ data: 1 })).rejects.toThrow("Unauthorized");

    (auth as any).mockResolvedValue({ userId: "user_test123" });
  });

  it("throws ForbiddenError when signed in without the admin role", async () => {
    const { clerkClient } = await import("@clerk/tanstack-react-start/server");
    (clerkClient as any).mockReturnValueOnce({
      users: { getUser: vi.fn().mockResolvedValue({ publicMetadata: {} }) },
    });

    await expect(deleteDeity({ data: 1 })).rejects.toThrow("Admin access required");
  });
});
