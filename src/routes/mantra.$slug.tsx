import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "~/server/db";
import { contents, deities } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { toggleLike, getLikeStatus, getLikeCount } from "~/server/functions/likes";
import { ProseRenderer } from "~/components/ProseRenderer";

const getContentBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const content = db.select().from(contents).where(eq(contents.slug, data)).get();
    if (!content) throw new Error("Content not found");
    const deity = db.select().from(deities).where(eq(deities.id, content.deityId)).get();
    return { content, deity };
  });

export const Route = createFileRoute("/mantra/$slug")({
  component: MantraPage,
  loader: async ({ params }) => {
    const data = await getContentBySlug({ data: params.slug });
    const count = await getLikeCount({ data: data.content.id });
    const status = await getLikeStatus({ data: data.content.id });
    return { ...data, likeCount: count, liked: status.liked };
  },
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-on-surface">Not found</h1>
        <Link to="/" className="mt-4 inline-block text-accent-gold hover:text-accent-saffron">
          Back to home
        </Link>
      </div>
    </main>
  ),
});

type ViewMode = "sanskrit" | "transliteration" | "translation";

function MantraPage() {
  const { content, deity, likeCount: initialCount, liked: initialLiked } = Route.useLoaderData();
  if (!deity) return null;
  const [view, setView] = useState<ViewMode>("sanskrit");
  const [fontSize, setFontSize] = useState(100);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [saved, setSaved] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("saved") || "[]");
    setSaved(savedIds.includes(content.id));
  }, [content.id]);

  const handleLike = useCallback(async () => {
    const result = await toggleLike({ data: content.id });
    setLiked(result.liked);
    setLikeCount((c) => c + (result.liked ? 1 : -1));
  }, [content.id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (canShare) {
      await navigator.share({ title: content.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [content.title]);

  const handleSave = useCallback(() => {
    const savedIds: number[] = JSON.parse(localStorage.getItem("saved") || "[]");
    if (savedIds.includes(content.id)) {
      const next = savedIds.filter((id) => id !== content.id);
      localStorage.setItem("saved", JSON.stringify(next));
      setSaved(false);
    } else {
      savedIds.push(content.id);
      localStorage.setItem("saved", JSON.stringify(savedIds));
      setSaved(true);
    }
  }, [content.id]);

  const bodyText =
    view === "transliteration" ? content.transliteration || content.body
    : view === "translation" ? content.translation || content.description
    : content.body;

  const isHtml = view === "sanskrit" && /<[a-z][\s\S]*>/i.test(bodyText);

  const bodyClass =
    view === "translation"
      ? "text-base leading-relaxed text-on-surface-variant"
      : view === "transliteration"
        ? "font-sans text-lg italic leading-relaxed tracking-wide text-on-surface"
        : "font-devanagari leading-[2] text-on-surface";

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-12 md:py-12">
        <Link
          to="/deity/$slug"
          params={{ slug: deity.slug }}
          className="mb-8 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          &larr; {deity.name}
        </Link>

        <div className="mb-2 flex items-center gap-3">
          <span className="inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
            {content.type}
          </span>
        </div>

        <h1 className="font-serif text-3xl font-semibold text-on-surface md:text-4xl">
          {content.title}
        </h1>

        {content.description && view !== "translation" && (
          <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
            {content.description}
          </p>
        )}

        <div className="mt-8 flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-1">
          {(["sanskrit", "transliteration", "translation"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === mode
                  ? "bg-accent-gold text-white"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {mode === "sanskrit" ? "Original" : mode === "transliteration" ? "Transliteration" : "Translation"}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setFontSize((s) => Math.max(60, s - 10))}
            className="rounded-md border border-outline-variant px-2.5 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Decrease font size"
          >
            A&minus;
          </button>
          <input
            type="range"
            min="60"
            max="180"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-surface-container-highest accent-accent-gold"
          />
          <button
            onClick={() => setFontSize((s) => Math.min(180, s + 10))}
            className="rounded-md border border-outline-variant px-2.5 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Increase font size"
          >
            A+
          </button>
          <span className="text-xs text-on-surface-variant tabular-nums">{fontSize}%</span>
        </div>

        {view === "translation" && content.description && (
          <p className="mt-6 text-base leading-relaxed text-on-surface-variant">
            {content.description}
          </p>
        )}

        <div
          className="mt-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 md:p-10"
          style={{ fontSize: `${fontSize}%` }}
        >
          {isHtml ? (
            <ProseRenderer html={bodyText} className={bodyClass} />
          ) : (
            <div className={`${bodyClass} whitespace-pre-line`}>
              {bodyText}
            </div>
          )}
        </div>

        {view === "translation" && content.translation && (
          <div className="mt-4 border-l-4 border-accent-gold bg-surface-container-low pl-4 py-3 pr-3 rounded-r-lg">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {content.translation}
            </p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-6 border-t border-outline-variant pt-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-accent-gold"
          >
            <span className={`text-lg transition-all ${liked ? "text-accent-gold scale-110" : ""}`}>
              {liked ? "\u2764" : "\u2661"}
            </span>
            <span>{likeCount}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 text-sm transition-colors ${
              saved ? "text-accent-gold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="text-lg">{saved ? "\u2605" : "\u2606"}</span>
            <span>{saved ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span className="text-lg">{canShare ? "\u21B1" : "\u2398"}</span>
            <span>{canShare ? "Share" : "Copy link"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
