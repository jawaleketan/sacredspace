import { useState, useRef } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { db, ensureSeeded } from "~/server/db";
import { deities } from "~/server/db/schema";
import { updateDeityImage, updateDeity, deleteDeity, createDeity, removeDeityImage } from "~/server/functions/deities";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";
import { ConfirmModal } from "~/components/ConfirmModal";

const getDeities = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureSeeded();
  return await db.select().from(deities).orderBy(deities.name).all();
});

export const Route = createFileRoute("/admin/deities")({
  component: AdminDeitiesPage,
  loader: async () => await getDeities(),
  errorComponent: () => <RouteErrorFallback title="Access Error" />,
});

function AdminDeitiesPage() {
  const router = useRouter();
  const items = Route.useLoaderData();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function getRef(deityId: number) {
    return (el: HTMLInputElement | null) => { fileRefs.current[deityId] = el; };
  }

  async function handleUpload(deityId: number, file: File) {
    const toBase64 = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result as string;
          resolve(result.split(",")[1]);
        };
        r.onerror = reject;
        r.readAsDataURL(f);
      });
    try {
      const imageBase64 = await toBase64(file);
      await updateDeityImage({ data: { deityId, imageBase64, fileName: file.name } });
      router.invalidate();
    } catch (e) { console.error("Upload failed", e); }
  }

  async function handleUpdate(id: number, name: string, slug: string, description: string) {
    try {
      await updateDeity({ data: { id, name, slug, description } });
      setEditing(null);
      router.invalidate();
    } catch (e) { console.error("Update failed", e); }
  }

  async function handleDelete(id: number, name: string) {
    setDeleting(null);
    try {
      await deleteDeity({ data: id });
      router.invalidate();
    } catch (e) { console.error("Delete failed", e); }
  }

  async function handleCreate(name: string, slug: string, description: string) {
    try {
      await createDeity({ data: { name, slug, description } });
      setCreating(false);
      router.invalidate();
    } catch (e) { console.error("Create failed", e); }
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/admin/dashboard"
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; Dashboard
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-semibold text-on-surface">Deities</h1>
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron"
          >
            + New deity
          </button>
        </div>

        {creating && (
          <InlineDeityForm
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((deity) =>
            editing === deity.id ? (
              <InlineDeityForm
                key={deity.id}
                initial={{ name: deity.name, slug: deity.slug, description: deity.description ?? "" }}
                onSave={(name, slug, description) =>
                  handleUpdate(deity.id, name, slug, description)
                }
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                key={deity.id}
                className="group relative rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-accent-gold/40"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                    {deity.imageUrl ? (
                      <img
                        src={deity.imageUrl}
                        alt={deity.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-serif font-semibold text-primary">
                        {deity.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-on-surface">
                      {deity.name}
                    </h3>
                    {deity.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                        {deity.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditing(deity.id)}
                    className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => fileRefs.current[deity.id]?.click()}
                    className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    {deity.imageUrl ? "Change image" : "Upload image"}
                  </button>
                  <input
                    ref={getRef(deity.id)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(deity.id, file);
                      if (e.target) e.target.value = "";
                    }}
                  />
                  {deity.imageUrl && (
                    <button
                      onClick={async () => {
                        try {
                          await removeDeityImage({ data: deity.id });
                          router.invalidate();
                        } catch (e) { console.error("Remove image failed", e); }
                      }}
                      className="ml-auto rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => setDeleting({ id: deity.id, name: deity.name })}
                    className="ml-auto rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <ConfirmModal
        open={deleting !== null}
        title="Delete deity"
        message={`Delete "${deleting?.name ?? ""}" and all its content? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleting && handleDelete(deleting.id, deleting.name)}
        onCancel={() => setDeleting(null)}
      />
    </main>
  );
}

function InlineDeityForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; slug: string; description: string };
  onSave: (name: string, slug: string, description: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="rounded-xl border border-accent-gold/40 bg-surface-container-lowest p-5">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initial) setSlug(e.target.value.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""));
            }}
            className="mt-1 w-full rounded-md border border-outline-variant bg-bg px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-on-surface-variant">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-md border border-outline-variant bg-bg px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-on-surface-variant">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-outline-variant bg-bg px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-gold"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(name, slug, description)}
            className="rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-outline-variant px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
