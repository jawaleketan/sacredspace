import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { db } from "~/server/db";
import { contents, deities } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const getData = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return db
    .select({
      id: contents.id,
      title: contents.title,
      slug: contents.slug,
      type: contents.type,
      status: contents.status,
      deityName: deities.name,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
    })
    .from(contents)
    .innerJoin(deities, eq(contents.deityId, deities.id))
    .orderBy(contents.updatedAt)
    .all();
});

const toggleStatus = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const item = db.select().from(contents).where(eq(contents.id, data)).get();
    if (!item) throw new Error("Not found");
    const newStatus = item.status === "published" ? "draft" : "published";
    db.update(contents).set({ status: newStatus }).where(eq(contents.id, data)).run();
    return { status: newStatus };
  });

const deleteItem = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    db.delete(contents).where(eq(contents.id, data)).run();
    return { deleted: true };
  });

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
  loader: async () => await getData(),
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-on-surface">Access Denied</h1>
        <p className="mt-2 text-on-surface-variant">Sign in to access the admin panel.</p>
        <Link to="/admin" className="mt-4 inline-block text-accent-gold hover:text-accent-saffron">
          Sign in
        </Link>
      </div>
    </main>
  ),
});

function DashboardPage() {
  const items = Route.useLoaderData();
  const router = useRouter();

  async function handleToggle(id: number) {
    await toggleStatus({ data: id });
    router.invalidate();
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteItem({ data: id });
    router.invalidate();
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-on-surface">Dashboard</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{items.length} items</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              View site
            </Link>
            <Link
              to="/admin/analytics"
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              Analytics
            </Link>
            <Link
              to="/admin/deities"
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              Deities
            </Link>
            <Link
              to="/admin/editor/new"
              className="rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron"
            >
              New content
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline-variant">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">Title</th>
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant hidden md:table-cell">Deity</th>
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant hidden lg:table-cell">Updated</th>
                <th className="px-4 py-3 text-right font-medium text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="bg-surface-container-lowest transition-colors hover:bg-surface-container-low/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/editor/$slug"
                      params={{ slug: item.slug }}
                      className="font-serif font-semibold text-on-surface transition-colors hover:text-accent-gold"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant hidden md:table-cell">
                    {item.deityName}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        item.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant hidden lg:table-cell tabular-nums">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover/row:opacity-100 hover:opacity-100">
                      <Link
                        to="/admin/editor/$slug"
                        params={{ slug: item.slug }}
                        className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                    No content yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
