import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getSavedContents } from "~/server/functions/saved";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { SavedSkeleton } from "~/components/Skeleton";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";
import { useToast } from "~/components/Toast";
import { STORAGE_KEYS } from "~/lib/constants";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  errorComponent: () => <RouteErrorFallback />,
  head: () => ({
    meta: [
      { title: "Saved — SacredSpace" },
      { name: "description", content: "Your saved mantras and stotras." },
    ],
  }),
});

interface SavedItem {
  id: number;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  deityName: string;
  deitySlug: string;
}

function SavedPage() {
  // Lazy initializer: localStorage is client-only, but SavedPage renders
  // client-side after hydration so this runs only in the browser.
  const [ids, setIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
    } catch {
      return []; /* localStorage unavailable */
    }
  });
  const { toast } = useToast();
  const [items, setItems] = useState<SavedItem[]>([]);
  // `loading` is derived: true until the fetch for the current ids resolves.
  // An empty saved-list never fetches, so it's never "loading".
  const [loadedForIds, setLoadedForIds] = useState<number[] | null>(null);
  const loading = ids.length > 0 && (loadedForIds === null || loadedForIds !== ids);
  const visibleItems = ids.length === 0 ? [] : items;

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    getSavedContents({ data: ids })
      .then((data) => { if (!cancelled) { setItems(data); setLoadedForIds(ids); } })
      .catch(() => { if (!cancelled) { setItems([]); setLoadedForIds(ids); } });
    return () => { cancelled = true; };
  }, [ids]);

  function removeItem(id: number) {
    const next = ids.filter((i) => i !== id);
    setIds(next);
    try { localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next)); } catch { /* localStorage unavailable */ }
    toast("Removed from saved", "info");
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Breadcrumbs items={[
          { label: "Home", to: "/" },
          { label: "Saved" },
        ]} />

        <h1 className="font-serif text-3xl font-semibold text-on-surface">Saved</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {loading ? "Loading..." : `${visibleItems.length} saved item${visibleItems.length !== 1 ? "s" : ""}`}
        </p>

        {loading && <SavedSkeleton />}

        {!loading && visibleItems.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-on-surface-variant">No saved items yet.</p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm text-accent-gold hover:text-accent-saffron"
            >
              Browse mantras and stotras
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-8 space-y-3">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-accent-gold/40 hover:shadow-sm"
              >
                <Link
                  to="/mantra/$slug"
                  params={{ slug: item.slug }}
                  className="min-w-0 flex-1"
                >
                  <h3 className="font-serif text-lg font-semibold text-on-surface truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                      {item.deityName}
                    </span>
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                      {item.type}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 rounded p-1.5 text-sm min-h-[44px] min-w-[44px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                  aria-label="Remove from saved"
                  title="Remove from saved"
                >
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
