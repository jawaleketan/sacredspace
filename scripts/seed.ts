import { db } from "../src/server/db";
import { deities, contents } from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { seedDeities, seedContents } from "../src/server/db/seed-data";

async function seed() {
  console.log("Seeding database...");

  const slugToId: Record<string, number> = {};
  for (const d of seedDeities) {
    const existing = await db.select().from(deities).where(eq(deities.slug, d.slug)).get();
    if (existing) {
      slugToId[d.slug] = existing.id;
      console.log(`  Skipped deity: ${d.name} (exists)`);
    } else {
      const result = await db.insert(deities).values(d).returning().get();
      slugToId[result.slug] = result.id;
      console.log(`  Added deity: ${d.name}`);
    }
  }

  for (const c of seedContents) {
    const deityId = slugToId[c.deitySlug];
    if (!deityId) {
      console.log(`  Skipped content: ${c.title} (deity not found)`);
      continue;
    }
    const existing = await db.select().from(contents).where(eq(contents.slug, c.slug)).get();
    if (existing) {
      await db.update(contents)
        .set({
          transliteration: c.transliteration,
          translation: c.translation,
          body: c.body,
          description: c.description,
        })
        .where(eq(contents.slug, c.slug))
        .run();
      console.log(`  Updated content: ${c.title}`);
    } else {
      await db.insert(contents)
        .values({
          deityId,
          type: c.type,
          title: c.title,
          slug: c.slug,
          body: c.body,
          transliteration: c.transliteration,
          translation: c.translation,
          description: c.description,
        })
        .run();
      console.log(`  Added content: ${c.title}`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
