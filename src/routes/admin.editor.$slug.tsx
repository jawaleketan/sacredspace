import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { db, ensureSeeded } from "~/server/db";
import { contents, deities, type ContentType, type ContentStatus } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { TipTapEditor } from "~/components/TipTapEditor";
import { uploadContentAudio, removeContentAudio } from "~/server/functions/audio";

const getEditorData = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();
    const item = await db.select().from(contents).where(eq(contents.slug, data)).get();
    const allDeities = await db.select().from(deities).orderBy(deities.name).all();
    return { item, allDeities };
  });

const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  return await db.select().from(deities).orderBy(deities.name).all();
});

const saveContent = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    title: string;
    deityId: number;
    type: ContentType;
    body: string;
    transliteration: string;
    translation: string;
    description: string;
    status: ContentStatus;
    audioUrl?: string | null;
    isNew?: boolean;
  }) => input)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();
    if (data.isNew) {
      const existing = await db.select({ id: contents.id }).from(contents).where(eq(contents.slug, data.slug)).get();
      if (existing) throw new Error("A content item with this slug already exists");
      await db.insert(contents)
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
      await db.update(contents)
        .set({
          deityId: data.deityId,
          type: data.type,
          title: data.title,
          body: data.body,
          transliteration: data.transliteration,
          translation: data.translation,
          description: data.description,
          status: data.status,
          audioUrl: data.audioUrl || null,
          updatedAt: new Date().toISOString(),
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
  const [type, setType] = useState<ContentType>(item?.type ?? "mantra");
  const [body, setBody] = useState(item?.body ?? "");
  const [transliteration, setTransliteration] = useState(item?.transliteration ?? "");
  const [translation, setTranslation] = useState(item?.translation ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "draft");
  const [audioUrl, setAudioUrl] = useState(item?.audioUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [message, setMessage] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);

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
    const currentSlug = isNew ? slug : item?.slug;
    if (!currentSlug) {
      setMessage("Content item not found.");
      setSaving(false);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await saveContent({
        data: {
          slug: currentSlug,
          title: title.trim(),
          deityId,
          type,
          body,
          transliteration,
          translation,
          description,
          status,
          audioUrl,
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
        <Breadcrumbs items={[
          { label: "Home", to: "/" },
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: isNew ? "New content" : `Edit: ${item?.title ?? ""}` },
        ]} />

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
              <label htmlFor="editor-title" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Title
              </label>
              <input
                id="editor-title"
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
                <label htmlFor="editor-slug" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Slug
                </label>
                <input
                  id="editor-slug"
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
              <label htmlFor="editor-deity" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Deity
              </label>
              <select
                id="editor-deity"
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
              <label htmlFor="editor-type" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Type
              </label>
              <select
                id="editor-type"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
              >
                <option value="mantra">Mantra</option>
                <option value="stotra">Stotra</option>
              </select>
            </div>
            <div>
              <label htmlFor="editor-status" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Status
              </label>
              <select
                id="editor-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="editor-body" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Sanskrit body
            </label>
            <TipTapEditor
              content={body}
              onChange={setBody}
              placeholder="Enter the Sanskrit text..."
            />
          </div>

          <div>
            <label htmlFor="editor-transliteration" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Transliteration (IAST)
            </label>
            <textarea
              id="editor-transliteration"
              value={transliteration}
              onChange={(e) => setTransliteration(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold font-sans italic"
              placeholder="Om ekadantāya vidmahe..."
            />
          </div>

          <div>
            <label htmlFor="editor-translation" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Translation
            </label>
            <textarea
              id="editor-translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
              placeholder="We meditate upon the single-tusked one..."
            />
          </div>

          <div>
            <label htmlFor="editor-description" className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Description
            </label>
            <textarea
              id="editor-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
              placeholder="A short description..."
            />
          </div>

          {!isNew && item && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Audio Recitation
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingAudio(true);
                    try {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      await new Promise((resolve) => { reader.onload = resolve; });
                      const result = reader.result as string;
                      const base64 = result.split(",")[1];
                      const resp = await uploadContentAudio({
                        data: { contentSlug: item.slug, audioBase64: base64, fileName: file.name },
                      });
                      setAudioUrl(resp.audioUrl);
                    } catch { setMessage("Error uploading audio.") }
                    setUploadingAudio(false);
                  }}
                />
                {audioUrl ? (
                  <>
                    <audio src={audioUrl} controls className="h-8 flex-1" preload="none" aria-label="Audio recitation" />
                    <button
                      type="button"
                      onClick={async () => {
                        await removeContentAudio({ data: item.slug });
                        setAudioUrl("");
                      }}
                      className="rounded px-2 py-1 text-xs min-h-[44px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-on-surface-variant">No audio file uploaded</span>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={uploadingAudio}
                      className="rounded-md border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                    >
                      {uploadingAudio ? "Uploading..." : "Upload audio"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

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
