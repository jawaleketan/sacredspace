# SacredSpace — Architecture

Technical reference for the SacredSpace app (`sacredspace/`). For setup instructions see [SETUP.md](./SETUP.md); for product requirements see [`planning/prds/`](./planning/prds).

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **TanStack Start** v1.168 | Full-stack React, SSR + server functions |
| Routing | **TanStack Router** | File-based routes in `src/routes/`, `routeTree.gen.ts` auto-generated |
| UI | **React 19** + **Tailwind CSS v4** | Material-3-inspired tokens (`bg`, `on-surface`, `accent-gold`…); typography plugin |
| Rich text | **TipTap** v3 | Admin editor; output sanitized server-side |
| Auth | **Clerk** (`@clerk/tanstack-react-start`) | `auth()` in server functions; `SignedIn/SignedOut` on client |
| Data layer | **Drizzle ORM** + **SQLite** via `@libsql/client` | Local file or Turso in production |
| Server runtime | **Nitro** v3 | Vercel preset, Build Output API v3 |
| Validation | **Zod** | All server function inputs validated via `.validator()` |
| PWA | `vite-plugin-pwa` | Service worker + update prompt |
| OG images | **Satori** | Dynamic SVG OG images per mantra page |

---

## 2. Data Model

Three tables (`src/server/db/schema.ts`):

```
deities (1) ────< contents (1) ────< likes
  id                id                 id
  name              deity_id  ────>    content_id ────> contents.id
  slug (unique)     type               session_id      (unique pair:
  description       title              created_at       content_id+session_id)
  image_url         slug (unique)
  created_at        status (published|draft)
  updated_at        body (HTML, sanitized)
                    transliteration / translation / description
                    audio_url
                    created_at / updated_at
```

Key points:
- **Slugs are unique** (`deities_slug_unique`, `contents_slug_unique`) — enforced at DB level
- **Likes dedupe** via unique index on `(content_id, session_id)` — one like per anonymous session per content
- **Soft "draft" status** — public queries mostly ignore drafts, but see [Known Gaps](#8-known-gaps--gotchas)
- Timestamps are ISO strings (`text`), defaulted via `$defaultFn`

---

## 3. Database Lifecycle (Cold-Start Bootstrap)

`src/server/db/index.ts` runs at module load:

```
validateEnv()                 → fails fast in dev if Clerk keys missing
createClient(url)             → Turso if TURSO_DATABASE_URL set,
                                else file:./data/sacredspace.db (local)
                                or file:/tmp/sacredspace.db (Vercel)
PRAGMA journal_mode = WAL
ensureSeeded()                → memoized promise:
   1. CREATE TABLE IF NOT EXISTS × 3 + unique indexes
   2. incremental migrations array (e.g. likes unique index)
   3. if deities table empty → batch insert 8 deities + 17 contents
   4. if deities exist but seed images were added later → backfill image_url
```

On Vercel, `/tmp/` is ephemeral: every cold start recreates + reseeds the DB. Set `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` for persistence.

---

## 4. Server Function Patterns

All backend logic lives in `src/server/functions/*.ts` as TanStack Start server functions. The codebase follows four recurring patterns:

### a) Public read pattern (rate-limited, unauthenticated)
```ts
export const getContent = createServerFn({ method: "GET" })
  .validator(slugParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();               // 120 req/min per IP (in-memory)
    const content = await db...;
    if (!content) throw new NotFoundError("Content");
    return content;
  });
```
Used by: `contents.ts`, `daily.ts`, `saved.ts`.

### b) Admin write pattern (Clerk-gated + rate-limited)
```ts
export const createContent = createServerFn({ method: "POST" })
  .validator(contentInput)                 // Zod schema
  .handler(async ({ data }) => {
    const { userId } = await auth();       // Clerk
    if (!userId) throw new UnauthorizedError();
    enforceRateLimit(`admin:${userId}`, { maxRequests: 60, windowMs: 60_000 });
    // ... db write with sanitize(data.body) for HTML fields
  });
```
Used by: `admin.ts`, `deities.ts`, `audio.ts`.

### c) Error model
Typed errors in `src/lib/errors.ts` — `AppError` base with `statusCode`, plus `UnauthorizedError` (401), `NotFoundError` (404), `RateLimitError` (429 with `retryAfterMs`), and `ConflictError` (409, used for duplicate slugs). Callers never parse messages to distinguish failure classes.

### d) Validation
Centralized Zod schemas in `src/server/functions/validators.ts` — `idParam`, `slugParam`, `contentInput`, `searchFilters`, upload shapes, OG input. Slug format is kebab-case-enforced by regex.

---

## 5. Anonymous Identity

Two mechanisms, deliberately different:

| Feature | Mechanism | Why |
|---------|-----------|-----|
| **Likes** | `session_id` httpOnly cookie + DB rows | Countable, analyzable (admin analytics), deduped |
| **Saved collection** | `localStorage` array of content IDs | Zero server cost, private to device |

`getClientIp()` in `rate-limit.ts` reads `x-forwarded-for` via `getRequestHeader` from `@tanstack/react-start/server` (lazy ESM import, `"anonymous"` fallback outside request contexts) — note the in-memory limiter resets per Lambda instance (see [Known Gaps](#8-known-gaps--gotchas)).

---

## 6. Frontend Patterns

- **Loaders do the data fetching** (`Route.useLoaderData()`), with `pendingComponent` skeletons and per-route `errorComponent` fallbacks (`RouteErrorFallback`).
- **Root layout** (`__root.tsx`) provides: ClerkProvider → QueryClientProvider → AudioProvider → ToastProvider, plus skip-link, PWA update modal, BackToTop.
- **Theme** — inline script in `<head>` applies `dark` class from localStorage before paint (no flash); the shared `useTheme()` hook (`src/lib/hooks.ts`) owns all subsequent reads/writes, including the homepage toggle.
- **Mantra reader** (`mantra.$slug.tsx`) — three view modes (Sanskrit / transliteration / translation), font-size control, HTML-vs-plaintext detection with `ProseRenderer` (sanitized via DOMPurify client-side too), audio player via `AudioProvider`, like/save/share action bar.
- **SEO** — per-route `head()` with JSON-LD (`WebSite` on home, `Article` on mantra pages) and Satori-generated OG images.

---

## 7. Deployment Topology (Vercel)

```
GitHub push → Vercel build (vite build → Nitro)
  → .vercel/output (Build Output API v3, nodejs24.x)
  → SSR + server fns run as Lambdas
  → SQLite in /tmp (ephemeral) OR Turso (persistent)
  → Uploads → Vercel Blob (BLOB_READ_WRITE_TOKEN) or local disk in dev
```

Relevant configs: `vercel.json`, `nitro.config.ts`, `.nvmrc` (Node 22+), `engines.node >= 22`.

---

## 8. Known Gaps & Gotchas

Recently addressed (all tests passing, 72/72):

1. ✅ **File uploads** — now go through `src/lib/storage.ts`: Vercel Blob when `BLOB_READ_WRITE_TOKEN` + `VERCEL` are set, local `public/uploads/` fallback in dev. Set the Blob token in Vercel project settings (or connect a Blob store) to persist uploads.
2. ✅ **Slug uniqueness** — `createContent`/`updateContent`/`createDeity`/`updateDeity` pre-check slugs and throw `ConflictError` (409) instead of surfacing raw DB constraint errors as 500s.
3. ✅ **`getMantraOfDay`** — filters `status = 'published'` for both the count and the picked row; drafts can no longer be featured.
4. ✅ **`getClientIp()`** — no more CJS `require("h3")`; uses `getRequestHeader` from `@tanstack/react-start/server` via a lazy dynamic import, falling back to `"anonymous"` in tests.
5. ✅ **Admin pagination** — `getAllContents` returns `{ items, total, page, pageSize, totalPages }` (50/page); the dashboard has Previous/Next controls backed by `?page=` search params.
6. ✅ **Theme** — shared `useTheme()` hook in `src/lib/hooks.ts`; `index.tsx` no longer duplicates the no-flash script logic.
7. ✅ **`updateDeity`** — now bumps `updatedAt` like content updates.
8. ✅ **`likes.ts`** — static imports instead of the dynamic `getDb()` indirection.

Remaining limitations:

- **In-memory rate limiting** — per-Lambda-instance only; cold starts reset counters (prominently documented in `src/lib/rate-limit.ts`). For hard global caps, back `checkRateLimit` with Upstash Redis / Vercel KV — call sites stay unchanged.
- **Old blob files aren't deleted** — replacing a deity image or audio file orphans the previous Blob object; add a `del()` call if storage costs matter.
- **Search uses `LIKE`** — fine at current scale, but consider FTS5 if the library grows large.
</content>
