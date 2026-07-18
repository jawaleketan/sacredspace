import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getSavedContents } from "~/server/functions/saved";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
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
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const savedIds: number[] = JSON.parse(localStorage.getItem("saved") || "[]");
    setIds(savedIds);
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSavedContents({ data: ids }).then(setItems).finally(() => setLoading(false));
  }, [ids]);

  function removeItem(id: number) {
    const next = ids.filter((i) => i !== id);
    setIds(next);
    localStorage.setItem("saved", JSON.stringify(next));
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; Home
        </Link>

        <h1 className="font-serif text-3xl font-semibold text-on-surface">Saved</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {loading ? "Loading..." : `${items.length} saved item${items.length !== 1 ? "s" : ""}`}
        </p>

        {loading && (
          <p className="py-16 text-center text-on-surface-variant">Loading...</p>
        )}

        {!loading && items.length === 0 && (
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
            {items.map((item) => (
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
                  className="shrink-0 rounded p-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
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
