import { useState, useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { db } from "~/server/db";
import { contents, deities } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TipTapEditor } from "~/components/TipTapEditor";

const getEditorData = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const item = db.select().from(contents).where(eq(contents.slug, data)).get();
    const allDeities = db.select().from(deities).orderBy(deities.name).all();
    return { item, allDeities };
  });

const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(deities).orderBy(deities.name).all();
});

const saveContent = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    title: string;
    deityId: number;
    type: "mantra" | "stotra";
    body: string;
    transliteration: string;
    translation: string;
    description: string;
    status: "published" | "draft";
    isNew?: boolean;
  }) => input)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    if (data.isNew) {
      db.insert(contents)
        .values({
          deityId: data.deityId,
          type: data.type,
          title: data.title,
          slug: data.slug,
          body: data.body,
          transliteration: data.transliteration,
          translation: data.translation,
          description: data.description,
          status: data.status,
        })
        .run();
    } else {
      db.update(contents)
        .set({
          deityId: data.deityId,
          type: data.type,
          title: data.title,
          body: data.body,
          transliteration: data.transliteration,
          translation: data.translation,
          description: data.description,
          status: data.status,
        })
        .where(eq(contents.slug, data.slug))
        .run();
    }
    return { ok: true };
  });

export const Route = createFileRoute("/admin/editor/$slug")({
  component: EditorPage,
  loader: async ({ params }) => {
    if (params.slug === "new") {
      const allDeities = await getAllDeities();
      return { item: null, allDeities, isNew: true };
    }
    return getEditorData({ data: params.slug }).then((r) => ({ ...r, isNew: false }));
  },
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-on-surface">Not found</h1>
        <Link to="/admin/dashboard" className="mt-4 inline-block text-accent-gold">
          Back to dashboard
        </Link>
      </div>
    </main>
  ),
});

function EditorPage() {
  const { item, allDeities, isNew } = Route.useLoaderData();
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [deityId, setDeityId] = useState(item?.deityId ?? allDeities[0]?.id ?? 0);
  const [type, setType] = useState<"mantra" | "stotra">(item?.type ?? "mantra");
  const [body, setBody] = useState(item?.body ?? "");
  const [transliteration, setTransliteration] = useState(item?.transliteration ?? "");
  const [translation, setTranslation] = useState(item?.translation ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [status, setStatus] = useState<"published" | "draft">(item?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isNew && !slug && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [title, slug, isNew]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setMessage("Title and body are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await saveContent({
        data: {
          slug: isNew ? slug : item!.slug,
          title: title.trim(),
          deityId,
          type,
          body,
          transliteration,
          translation,
          description,
          status,
          isNew,
        },
      });
      setMessage("Saved successfully!");
      if (isNew) {
        router.navigate({ to: "/admin/dashboard" });
      }
    } catch {
      setMessage("Error saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/admin/dashboard"
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; Dashboard
        </Link>

        <h1 className="font-serif text-3xl font-semibold text-on-surface">
          {isNew ? "New content" : `Edit: ${item?.title}`}
        </h1>

        {message && (
          <p className={`mt-4 text-sm ${message.includes("Error") ? "text-error" : "text-green-700 dark:text-green-400"}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
                placeholder="e.g. Ganesha Gayatri"
              />
            </div>
            {isNew && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold font-mono"
                  placeholder="ganesha-gayatri"
                />
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Deity
              </label>
              <select
                value={deityId}
                onChange={(e) => setDeityId(Number(e.target.value))}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
              >
                {allDeities.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "mantra" | "stotra")}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
              >
                <option value="mantra">Mantra</option>
                <option value="stotra">Stotra</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Sanskrit body
            </label>
            <TipTapEditor
              content={body}
              onChange={setBody}
              placeholder="Enter the Sanskrit text..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Transliteration (IAST)
            </label>
            <textarea
              value={transliteration}
              onChange={(e) => setTransliteration(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold font-sans italic"
              placeholder="Om ekadantāya vidmahe..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Translation
            </label>
            <textarea
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
              placeholder="We meditate upon the single-tusked one..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
              placeholder="A short description..."
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent-gold px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron disabled:opacity-50"
            >
              {saving ? "Saving..." : isNew ? "Create" : "Save changes"}
            </button>
            <Link
              to="/admin/dashboard"
              className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
