import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "~/server/db";
import { deities, contents } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { DeitySkeleton } from "~/components/Skeleton";

const getDeityBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const deity = await db.select().from(deities).where(eq(deities.slug, data)).get();
    if (!deity) throw new Error("Deity not found");
    return deity;
  });

const getContentsForDeity = createServerFn({ method: "GET" })
  .validator((deityId: number) => deityId)
  .handler(async ({ data }) => {
    await ensureSeeded();
    return await db
      .select()
      .from(contents)
      .where(eq(contents.deityId, data))
      .orderBy(contents.type, contents.title)
      .all();
  });

export const Route = createFileRoute("/deity/$slug")({
  component: DeityPage,
  pendingComponent: DeitySkeleton,
  loader: async ({ params }) => {
    const deity = await getDeityBySlug({ data: params.slug });
    const contentList = await getContentsForDeity({ data: deity.id });
    return { deity, contentList };
  },
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-on-surface">Deity not found</h1>
        <Link to="/" className="mt-4 inline-block text-accent-gold hover:text-accent-saffron">
          Back to home
        </Link>
      </div>
    </main>
  ),
});

function DeityPage() {
  const { deity, contentList } = Route.useLoaderData();
  const router = useRouter();
  const mantras = contentList.filter((c) => c.type === "mantra");
  const stotras = contentList.filter((c) => c.type === "stotra");

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; Back
        </Link>

        <div className="mb-12">
          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-surface-container text-4xl font-serif font-semibold text-primary">
            {deity.imageUrl ? (
              <img src={deity.imageUrl} alt={deity.name} className="h-full w-full object-cover" />
            ) : (
              deity.name.charAt(0)
            )}
          </div>
          <h1 className="font-serif text-4xl font-semibold text-on-surface md:text-5xl">
            {deity.name}
          </h1>
          {deity.description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant">
              {deity.description}
            </p>
          )}
        </div>

        {mantras.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl font-semibold text-on-surface">
              Mantras
            </h2>
            <div className="space-y-3">
              {mantras.map((item) => (
                <Link
                  key={item.id}
                  to="/mantra/$slug"
                  params={{ slug: item.slug }}
                  className="block rounded-lg border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-accent-gold/40 hover:shadow-sm"
                >
                  <h3 className="font-serif text-lg font-semibold text-on-surface">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {stotras.length > 0 && (
          <section>
            <h2 className="mb-4 font-serif text-2xl font-semibold text-on-surface">
              Stotras
            </h2>
            <div className="space-y-3">
              {stotras.map((item) => (
                <Link
                  key={item.id}
                  to="/mantra/$slug"
                  params={{ slug: item.slug }}
                  className="block rounded-lg border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-accent-gold/40 hover:shadow-sm"
                >
                  <h3 className="font-serif text-lg font-semibold text-on-surface">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {contentList.length === 0 && (
          <p className="py-12 text-center text-on-surface-variant">
            No mantras or stotras yet.
          </p>
        )}
      </div>
    </main>
  );
}
