import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getAllContents, toggleContentStatus, deleteContent } from "~/server/functions/admin";
import { AppError } from "~/lib/errors";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { ConfirmModal } from "~/components/ConfirmModal";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

function DashboardErrorComponent({ error, reset }: { error: Error; reset?: () => void }) {
  // 401 Unauthorized → sign-in prompt; everything else → generic fallback
  if (error instanceof AppError && error.statusCode === 401) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-on-surface">Access Denied</h1>
          <p className="mt-2 text-on-surface-variant">Sign in to access the admin panel.</p>
          <Link to="/admin" className="mt-4 inline-block text-accent-gold hover:text-accent-saffron">
            Sign in
          </Link>
        </div>
      </main>
    );
  }
  return <RouteErrorFallback title="Dashboard Error" error={error} reset={reset} />;
}

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = Number(search.page);
    return Number.isFinite(page) && page > 0 ? { page: Math.floor(page) } : {};
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ deps }) => await getAllContents({ data: { page: deps.page } }),
  errorComponent: ({ error, reset }) => (
    <DashboardErrorComponent error={error} reset={reset} />
  ),
});

function DashboardPage() {
  const { items, total, page, totalPages } = Route.useLoaderData();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle(id: number) {
    setToggling(id);
    try {
      await toggleContentStatus({ data: id });
      router.invalidate();
    } catch (e) { console.error("Toggle failed", e); }
    finally { setToggling(null); }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    setDeleteConfirm(null);
    try {
      await deleteContent({ data: id });
      router.invalidate();
    } catch (e) { console.error("Delete failed", e); }
    finally { setDeleting(false); }
  }

  function goToPage(p: number) {
    navigate({ search: { page: p } });
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12">
        <Breadcrumbs items={[
          { label: "Home", to: "/" },
          { label: "Dashboard" },
        ]} />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-on-surface">Dashboard</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{total} items</p>
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
              to="/admin/editor/$slug"
              params={{ slug: "new" }}
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
                  className="group/row bg-surface-container-lowest transition-colors hover:bg-surface-container-low/50"
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
                      disabled={toggling === item.id}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium min-h-[44px] transition-colors ${
                        item.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-surface-container text-on-surface-variant"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {toggling === item.id ? "..." : item.status}
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
                        className="rounded px-2 py-1 text-xs min-h-[44px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ id: item.id, title: item.title })}
                        className="rounded px-2 py-1 text-xs min-h-[44px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              &larr; Previous
            </button>
            <span className="text-sm text-on-surface-variant tabular-nums">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={deleteConfirm !== null}
        title="Delete content"
        message={`Delete "${deleteConfirm?.title ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </main>
  );
}
