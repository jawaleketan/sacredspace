import { z } from "zod";

// ── Common primitives ──────────────────────────────────────────────

export const idParam = z.number().int().positive();
export const slugParam = z.string().min(1).max(200);

// ── Content ────────────────────────────────────────────────────────

const contentTypeEnum = z.enum(["mantra", "stotra"]);
const contentStatusEnum = z.enum(["published", "draft"]);

export const contentInput = z.object({
  deityId: z.number().int().positive(),
  type: contentTypeEnum,
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Slug must be kebab-case (lowercase letters, numbers, hyphens)",
  }),
  body: z.string().min(1),
  transliteration: z.string().max(5000).optional().default(""),
  translation: z.string().max(5000).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  status: contentStatusEnum,
});

export const contentInputWithId = contentInput.extend({
  id: z.number().int().positive(),
});

// ── Search ─────────────────────────────────────────────────────────

export const searchFilters = z.object({
  query: z.string().max(200).default(""),
  deitySlug: z.string().max(200).optional(),
  type: contentTypeEnum.optional(),
  sortBy: z.enum(["alpha", "newest"]).optional(),
});

// ── Saved ──────────────────────────────────────────────────────────

export const savedIds = z.array(z.number().int().positive()).max(100);

// ── Deity ──────────────────────────────────────────────────────────

export const deityCreate = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Slug must be kebab-case (lowercase letters, numbers, hyphens)",
  }),
  description: z.string().max(2000).default(""),
});

export const deityUpdate = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Slug must be kebab-case (lowercase letters, numbers, hyphens)",
  }),
  description: z.string().max(2000),
});

// ── Uploads ────────────────────────────────────────────────────────

export const imageUpload = z.object({
  deityId: z.number().int().positive(),
  imageBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
});

export const audioUpload = z.object({
  contentSlug: z.string().min(1).max(200),
  audioBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
});

// ── OG Image ───────────────────────────────────────────────────────

export const ogImageInput = z.object({
  title: z.string().min(1).max(500),
  deityName: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  body: z.string().max(10000),
  slug: z.string().min(1).max(200),
});
