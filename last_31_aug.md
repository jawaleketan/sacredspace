# SacredSpace — Project Analysis (August 31, 2026 — Updated September 5, 2026)

---

## Stack

TanStack Start + React 19 + Tailwind v4 + Clerk + Tiptap + Drizzle ORM + SQLite + PWA

---

## What's Good

- Clean project structure with file-based routing
- Strong accessibility (skip-to-content, ARIA labels, semantic HTML, 44px touch targets)
- PWA with offline support via service worker
- Well-designed admin panel with Clerk auth
- "Mantra of the Day" feature
- Flexible view modes (Sanskrit, transliteration, translation)
- Full audio player with speed/volume/loop controls
- Dark mode with localStorage persistence
- Server-side OG image generation (Satori)
- Test coverage (9 test files, 67 tests)
- Auto-migration + auto-seed for database (runs once at startup)

---

## 🔴 Critical Issues

### 1. ~~XSS Vulnerability~~ ✅ Fixed

Server-side HTML sanitization via `sanitize-html` in `admin.ts`. DOMPurify available client-side in `ProseRenderer.tsx`.

### 2. ~~Typecheck Fails~~ ✅ Fixed

`npx tsc --noEmit` passes cleanly with zero errors.

### 3. ~~`validateEnv()` Never Called~~ ✅ Fixed (Sept 5)

`validateEnv()` is now called at module load in `src/server/db/index.ts`. Runs once per cold start before DB connection or seeding. In development, throws immediately if `VITE_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY` are missing. In production, logs the error.

---

## 🟡 High-Impact Improvements

### 4. ~~Duplicated Search Logic~~ ✅ Fixed

`searchContents` in `server/functions/contents.ts` is the canonical implementation. The search route imports it directly.

### 5. Duplicated Admin CRUD

`admin.dashboard.tsx` reimplements `toggleStatus` and `deleteItem` as inline server functions, duplicating `toggleContentStatus` and `deleteContent` from `server/functions/admin.ts`.

**Fix:** Import the existing functions from the admin module.

### 15. Duplicated `getAllDeities` ✅ Fixed

Removed unused duplicate from `deities.ts`. Canonical version in `contents.ts` used by all routes and tests.

### 6. ~~No Input Validation on Search~~ ✅ Fixed

All 19 server function inputs now validated with Zod schemas (`validators.ts`). Slugs enforce kebab-case, strings have length limits, IDs must be positive integers, arrays capped at 100 items.

### 7. ~~DB Seeding Runs N+1 Queries~~ ✅ Fixed

Already uses batch insert (`db.insert(deities).values(seedDeities)`) and maps slugs to IDs from returning rows.

### 4b. ~~Duplicated Server Functions in Mantra/Deity Routes~~ ✅ Fixed (Sept 5)

`mantra.$slug.tsx` and `deity.$slug.tsx` previously defined their own inline `createServerFn` handlers with dynamic imports and `ensureSeeded()` calls. Now all four functions are centralized in `server/functions/contents.ts`:

- `getContentBySlugWithDeity` — returns `{ content, deity }` by slug (with rate limiting + `NotFoundError`)
- `getSiblingContent` — returns published siblings for a deity excluding one slug
- `getDeityBySlug` — returns a deity by slug (with rate limiting + `NotFoundError`)
- `getContentsByDeitySorted` — returns all contents for a deity sorted by type then title

Both routes now import from the centralized module. ~55 lines of duplicated code removed.

---

## 🟢 Quality & Feature Improvements

### 8. ~~Structured Data (Schema.org)~~ ✅ Implemented

`WebSite` schema on homepage with `SearchAction`. `Article` schema on mantra pages with `headline`, `datePublished`, `author`, `publisher`, `about`, `inLanguage`, `keywords`. Generated in route `head()` functions.

### 9. ~~Expand Test Coverage~~ ✅ Improved (Sept 5)

9 test files with **67 tests**:
- `DeityCard.test.tsx` (5 tests)
- `Toast.test.tsx` (4 tests)
- `daily.test.ts` (2 tests)
- `likes.test.ts` (6 tests)
- `contents.test.ts` (21 tests) — expanded with 9 new tests for centralized functions
- `admin.test.ts` (11 tests)
- `deities.test.ts` (11 tests) — NEW
- `saved.test.ts` (4 tests) — NEW
- `analytics.test.ts` (3 tests) — NEW

**New tests for centralized functions (Sept 5):**
- `getContentBySlugWithDeity`: returns content+deity, throws on missing, handles orphan content
- `getSiblingContent`: returns siblings excluding slug, returns empty for single content
- `getDeityBySlug`: returns deity, throws on missing
- `getContentsByDeitySorted`: returns sorted contents, returns empty for deity with no content

Still missing: search route, auth flows, audio player, breadcrumbs, skeleton components.

### 10. Error Boundaries

Only a few routes define `errorComponent`. A global error boundary in `__root.tsx` would catch unexpected failures and provide a consistent fallback UI.

### 18. Custom Error Classes ✅ Implemented

`src/lib/errors.ts` provides `AppError`, `UnauthorizedError` (401), `NotFoundError` (404), and `RateLimitError` (429). All 16 throw sites across server functions updated. Routes/error boundaries can now catch `instanceof AppError` and switch on `statusCode`.

### 11. ~~Search Debounce~~ ✅ Implemented

Search input debounced at 300ms via `useDebouncedCallback` custom hook. Typing triggers server re-fetch only after 300ms of inactivity.

### 12. Internationalization

Content has Sanskrit/English, but the UI is English-only. No `lang` attributes on non-Latin text sections. Devanagari text would benefit from `lang="sa"` for screen readers.

### 13. ~~Rate Limiting~~ ✅ Implemented

- Admin endpoints: 30–60 req/min per user
- Like toggling: 30 req/min per session
- Public endpoints (deities, contents, search, daily, saved): 120 req/min per IP via `x-forwarded-for`

### 14. Image Optimization

Deity images are base64 or static files in `public/uploads/`. No responsive images, WebP conversion, or lazy loading beyond PWA caching.

### 16. `ensureSeeded()` Called Per Request ✅ Fixed

Previously every server function called `ensureSeeded()` (DB migration + seed check). Now runs once at module load time — once per cold start, not per request.

### 17. `getMantraOfDay` Loads All Rows ✅ Fixed

Previously fetched every content row into memory to pick one. Now uses `COUNT` + `LIMIT/OFFSET` to fetch exactly 1 row, with deity joined in a single query.

### 19. ~~Audio Player Accessibility~~ ✅ Improved (Sept 5)

`AudioProvider.tsx` updated with comprehensive accessibility:
- `role="region"` + `aria-label="Audio player"` on the container
- Progress bar: `role="slider"` with `tabIndex={0}`, `aria-valuemin/max/now/text`, keyboard navigation (ArrowLeft/Right ±5%, Home/End), focus-visible ring
- Track info: `aria-live="polite"` announces new track to screen readers
- Time display: `aria-hidden` (redundant with slider's `aria-valuetext`)
- Speed buttons: `aria-pressed` + `aria-label="Speed 1.5x"`
- Volume slider: `aria-labelledby` + `aria-valuetext="75%"`
- Loop button: `aria-pressed` + `aria-label="Loop"`

### 20. ~~Font Preconnect~~ ✅ Implemented (Sept 5)

Added `<link rel="preconnect">` for `fonts.googleapis.com` and `fonts.gstatic.com` (with `crossOrigin="anonymous"`) in `__root.tsx`. Fonts already use `font-display: swap`. Typical savings: 50–150ms on first paint.

### 21. ~~CSP Headers Tightened~~ ✅ Implemented (Sept 5)

Content-Security-Policy in `vercel.json` updated with:
- `worker-src 'self'` — restricts service worker loading to same-origin
- `base-uri 'self'` — prevents `<base href>` injection attacks

---

## 📊 Current State Summary

| Area | Status |
|---|---|
| Planning docs (PRD, UX, Architecture) | ✅ Complete |
| Visitor routes (home, deity, mantra, search, saved) | ✅ Built |
| Admin routes (dashboard, editor, deities, analytics) | ✅ Built |
| Auth (Clerk sign-in/sign-up) | ✅ Fixed & deployed |
| Audio player | ✅ Built |
| Audio player accessibility | ✅ ARIA roles, keyboard nav, aria-live |
| PWA / Offline | ✅ Built |
| OG images | ✅ Built |
| Dark mode | ✅ Built |
| Design system | ✅ Polished |
| Database (auto-seed + migration) | ✅ Working |
| GitHub remote | ✅ github.com/jawaleketan/sacredspace |
| Vercel deployment | ✅ Live at sacredspace.vercel.app |
| Tests | ✅ 9 files, 67 tests |
| Security (XSS, input validation, CSP) | ✅ Sanitized + Zod validated + CSP headers |
| Rate limiting | ✅ Public + admin + likes |
| Error handling | ✅ Custom error classes (401/404/429) |
| SEO (structured data, meta) | ✅ WebSite + Article schemas |
| Code deduplication | ✅ Major duplicates removed (mantra/deity routes centralized) |
| TypeScript strictness | ✅ Typecheck passes clean |
| Input validation | ✅ Zod schemas on all 19 endpoints |
| Env validation | ✅ validateEnv() called at module load |
| Performance (fonts) | ✅ Preconnects + font-display swap |
