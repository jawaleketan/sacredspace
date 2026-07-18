import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "~/server/db";
import { deities } from "~/server/db/schema";
import { searchContents, type SearchFilters } from "~/server/functions/contents";

const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(deities).orderBy(deities.name).all();
});

const doSearch = createServerFn({ method: "GET" })
  .validator((filters: SearchFilters) => filters)
  .handler(async ({ data }) => searchContents({ data }));

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? "",
    deity: search.deity ?? "",
    type: search.type ?? "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q, deity: search.deity, type: search.type }),
  loader: async ({ deps }) => {
    const [results, deityList] = await Promise.all([
      doSearch({
        data: {
          query: deps.q,
          deitySlug: deps.deity || undefined,
          type: (deps.type as "mantra" | "stotra" | undefined) || undefined,
        },
      }),
      getAllDeities(),
    ]);
    return { results, deityList, query: deps.q };
  },
});

const typeChips = [
  { label: "All", value: "" },
  { label: "Mantra", value: "mantra" },
  { label: "Stotra", value: "stotra" },
] as const;

function SearchPage() {
  const { results, deityList, query: initialQuery } = Route.useLoaderData();
  const search = useSearch({ from: Route.id });
  const navigate = useNavigate();
  const [input, setInput] = useState(search.q || initialQuery || "");

  useEffect(() => {
    setInput(search.q || "");
  }, [search.q]);

  function updateFilters(updates: Partial<typeof search>) {
    navigate({
      to: "/search",
      search: (prev) => ({ q: prev.q || "", deity: prev.deity || "", type: prev.type || "", ...updates }),
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: input });
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

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              &#x1F50D;
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search mantras and stotras..."
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
            />
          </div>
        </form>

        <div className="mb-8 flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant self-center mr-2">
            Deity
          </span>
          <button
            onClick={() => updateFilters({ deity: "" })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !search.deity
                ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            All
          </button>
          {deityList.map((d) => (
            <button
              key={d.slug}
              onClick={() => updateFilters({ deity: d.slug === search.deity ? "" : d.slug })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                search.deity === d.slug
                  ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant self-center mr-2">
            Type
          </span>
          {typeChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => updateFilters({ type: chip.value })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                search.type === chip.value
                  ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {search.q && (
          <p className="mb-6 text-sm text-on-surface-variant">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{search.q}&rdquo;
            {search.deity ? ` in ${deityList.find((d) => d.slug === search.deity)?.name}` : ""}
            {search.type ? ` (${search.type})` : ""}
          </p>
        )}

        {!search.q && !search.deity && !search.type && (
          <p className="py-16 text-center text-on-surface-variant">
            Enter a search term or select a filter to browse mantras and stotras.
          </p>
        )}

        {results.length === 0 && (search.q || search.deity || search.type) && (
          <p className="py-16 text-center text-on-surface-variant">
            No results found. Try a different search term or filter.
          </p>
        )}

        <div className="space-y-3">
          {results.map((item) => (
            <Link
              key={item.id}
              to="/mantra/$slug"
              params={{ slug: item.slug }}
              className="block rounded-lg border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-accent-gold/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-on-surface truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                    {item.deityName}
                  </span>
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    {item.type}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
