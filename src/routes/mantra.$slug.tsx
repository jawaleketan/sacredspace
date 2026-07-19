import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "~/server/db";
import { contents, deities } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { toggleLike, getLikeStatus, getLikeCount } from "~/server/functions/likes";
import { useAudio } from "~/components/AudioProvider";
import { ProseRenderer } from "~/components/ProseRenderer";
import { generateOgImage } from "~/server/functions/og";
import { MantraSkeleton } from "~/components/Skeleton";
import { useToast } from "~/components/Toast";
import { SITE_URL, STORAGE_KEYS } from "~/lib/constants";

const getContentBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const content = await db.select().from(contents).where(eq(contents.slug, data)).get();
    if (!content) throw new Error("Content not found");
    const deity = await db.select().from(deities).where(eq(deities.id, content.deityId)).get();
    return { content, deity };
  });

export const Route = createFileRoute("/mantra/$slug")({
  component: MantraPage,
  pendingComponent: MantraSkeleton,
  loader: async ({ params }) => {
    const data = await getContentBySlug({ data: params.slug });
    const count = await getLikeCount({ data: data.content.id });
    const status = await getLikeStatus({ data: data.content.id });
    let ogImage = "";
    try {
      ogImage = await generateOgImage({
        data: {
          title: data.content.title,
          deityName: data.deity?.name ?? "",
          type: data.content.type,
          body: data.content.body,
          slug: data.content.slug,
        },
      });
    } catch {}
    return { ...data, likeCount: count, liked: status.liked, ogImage };
  },
  head: ({ loaderData }) => {
    const c = loaderData!.content;
    const d = loaderData!.deity;
    const title = `${c.title} — ${d?.name ?? ""} | SacredSpace`;
    const desc = (c.description || c.translation)?.slice(0, 160) ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.title} — ${d?.name ?? ""}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${SITE_URL}/mantra/${c.slug}` },
        ...(loaderData!.ogImage
          ? [
              { property: "og:image", content: loaderData!.ogImage },
              { name: "twitter:card", content: "summary_large_image" },
              { name: "twitter:title", content: `${c.title} — ${d?.name ?? ""}` },
              { name: "twitter:description", content: desc },
              { name: "twitter:image", content: loaderData!.ogImage },
            ]
          : [{ name: "twitter:card", content: "summary" } as const]),
      ],
    };
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
  const { play: playAudio, track: currentTrack, isPlaying: audioPlaying } = useAudio();
  const { toast } = useToast();
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const isCurrentTrack = currentTrack?.url === content.audioUrl;

  useEffect(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
      setSaved(savedIds.includes(content.id));
    } catch { /* localStorage unavailable */ }
  }, [content.id]);

  const handleLike = useCallback(async () => {
    const result = await toggleLike({ data: content.id });
    setLiked(result.liked);
    setLikeCount((c) => c + (result.liked ? 1 : -1));
  }, [content.id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (canShare) {
        await navigator.share({ title: content.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard", "info");
      }
    } catch { /* user cancelled or API unavailable */ }
  }, [content.title]);

  const handleSave = useCallback(() => {
    try {
      const savedIds: number[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
      if (savedIds.includes(content.id)) {
        const next = savedIds.filter((id) => id !== content.id);
        localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next));
        setSaved(false);
        toast("Removed from saved", "info");
      } else {
        savedIds.push(content.id);
        localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(savedIds));
        setSaved(true);
        toast("Saved!", "success");
      }
    } catch { /* localStorage unavailable */ }
  }, [content.id]);

  const bodyText =
    view === "transliteration" ? content.transliteration || content.body
    : view === "translation" ? content.translation || content.description
    : content.body;

  const isHtml = view === "sanskrit" && /<[a-z][\s\S]*>/i.test(bodyText ?? "");

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

        {content.audioUrl && (
          <div className="mt-6">
            <button
              onClick={() => {
                if (isCurrentTrack && audioPlaying) return;
                playAudio({ url: content.audioUrl!, title: content.title, deityName: deity.name });
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                isCurrentTrack
                  ? "border-accent-gold bg-accent-gold/5"
                  : "border-outline-variant bg-surface-container-lowest hover:border-accent-gold/40 hover:bg-surface-container-low"
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isCurrentTrack ? "bg-accent-gold text-white" : "bg-surface-container text-accent-gold"
              }`}>
                {isCurrentTrack && audioPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-on-surface">
                  {isCurrentTrack && audioPlaying ? "Now Playing" : isCurrentTrack ? "Paused" : "Listen to Recitation"}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {isCurrentTrack ? `${deity.name} · ${content.title}` : "Audio available"}
                </div>
              </div>
              {isCurrentTrack && (
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-accent-gold animate-pulse" />
                  <span className="text-xs text-accent-gold font-medium">LIVE</span>
                </div>
              )}
            </button>
          </div>
        )}

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
            <ProseRenderer html={bodyText ?? ""} className={bodyClass} />
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
