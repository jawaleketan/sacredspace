import { createFileRoute, Link } from "@tanstack/react-router";
import { getAnalytics } from "~/server/functions/analytics";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
  loader: async () => await getAnalytics(),
  errorComponent: () => <RouteErrorFallback title="Access Error" />,
});

const MAX_BAR_WIDTH = 100;

function AdminAnalytics() {
  const data = Route.useLoaderData();
  const maxLikes = data.likesPerContent.length > 0 ? data.likesPerContent[0].count : 0;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/admin/dashboard"
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; Dashboard
        </Link>

        <h1 className="font-serif text-3xl font-semibold text-on-surface">Analytics</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="Total Items" value={data.totalItems} />
          <SummaryCard label="Total Likes" value={data.totalLikes} />
          <SummaryCard label="Published" value={data.publishedCount} />
          <SummaryCard label="Drafts" value={data.draftsCount} />
        </div>

        <h2 className="mt-12 font-serif text-xl font-semibold text-on-surface">Likes per Content</h2>

        {data.likesPerContent.length === 0 && (
          <p className="mt-6 text-sm text-on-surface-variant">No likes yet.</p>
        )}

        {data.likesPerContent.length > 0 && (
          <div className="mt-6 space-y-3">
            {data.likesPerContent.map((item) => {
              const pct = maxLikes > 0 ? (item.count / maxLikes) * MAX_BAR_WIDTH : 0;
              return (
                <Link
                  key={item.contentId}
                  to="/admin/editor/$slug"
                  params={{ slug: item.slug }}
                  className="group block"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-right text-sm font-semibold text-on-surface tabular-nums">
                      {item.count}
                    </span>
                    <div className="flex-1">
                      <div className="relative h-7 w-full rounded-md bg-surface-container">
                        <div
                          className="h-full rounded-md bg-accent-gold/70 transition-all duration-500 group-hover:bg-accent-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex gap-2 pl-11 text-xs text-on-surface-variant">
                    <span className="truncate font-medium text-on-surface">{item.title}</span>
                    <span className="uppercase tracking-wider">{item.type}</span>
                    <span>&middot;</span>
                    <span>{item.deityName}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold text-on-surface tabular-nums">{value}</p>
    </div>
  );
}
