import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const CONTENT_TYPES = ["mantra", "stotra"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const CONTENT_STATUSES = ["published", "draft"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const deities = sqliteTable("deities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const contents = sqliteTable("contents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deityId: integer("deity_id").notNull().references(() => deities.id),
  type: text("type", { enum: CONTENT_TYPES }).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: CONTENT_STATUSES }).notNull().default("published"),
  body: text("body").notNull(),
  transliteration: text("transliteration"),
  translation: text("translation"),
  description: text("description"),
  audioUrl: text("audio_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull().references(() => contents.id),
  sessionId: text("session_id").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const deitiesRelations = relations(deities, ({ many }) => ({
  contents: many(contents),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
  deity: one(deities, { fields: [contents.deityId], references: [deities.id] }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  content: one(contents, { fields: [likes.contentId], references: [contents.id] }),
}));
