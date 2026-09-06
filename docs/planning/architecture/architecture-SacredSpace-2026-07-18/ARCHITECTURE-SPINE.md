---
name: SacredSpace
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: feature-based modular with visitor/admin domain split
scope: SacredSpace full-stack mantra & stotra directory
status: final
created: 2026-07-18
updated: 2026-07-18
binds: []
sources:
  - {planning_artifacts}/prds/prd-SacredSpace-2026-07-18/prd.md
  - {planning_artifacts}/ux-designs/ux-SacredSpace-2026-07-18/DESIGN.md
  - {planning_artifacts}/ux-designs/ux-SacredSpace-2026-07-18/EXPERIENCE.md
companions: []
---

# Architecture Spine — SacredSpace

## Design Paradigm

Feature-based modular with visitor/admin domain split. Code is organized by feature (mantras, deities, search, admin), with a clear boundary between visitor-facing routes (`/`) and admin routes (`/admin/`). Shared utilities and types live in a common layer.

```
src/
  common/          # Shared components, types, utilities, db client
  features/
    visitor/
      home/        # God cards grid, featured content
      deities/     # Deity directory, deity detail page
      mantras/     # Mantra/stotra detail, reader, enhanced mode
      search/      # Search bar, filter chips, results
      saved/       # Anonymous saved collection
    admin/
      auth/        # Clerk login gate
      dashboard/   # Content management table, stats
      editor/      # Tiptap CRUD editor
      categories/  # Deity category management
      analytics/   # Likes, engagement charts
```

## Invariants & Rules

### AD-1 — Visitor routes are public; admin routes are Clerk-guarded

- **Binds:** All route definitions
- **Prevents:** Visitor pages requiring auth; admin pages being accessible without auth
- **Rule:** Admin routes use TanStack Router's `beforeLoad` with Clerk `auth()` middleware to redirect unauthenticated requests to `/admin`. Visitor routes never check auth.

### AD-2 — Server state goes through TanStack Query

- **Binds:** All data fetching (contents, likes, deities)
- **Prevents:** Direct `useEffect` fetch calls, disparate caching strategies
- **Rule:** Every data fetch is a TanStack Query `useQuery`/`useSuspenseQuery` call keyed to a stable query key factory. Mutations go through `useMutation` with cache invalidation on success.

### AD-3 — Anonymous likes tracked by session cookie

- **Binds:** `likes` table writes
- **Prevents:** Duplicate likes from same visitor; requiring user accounts
- **Rule:** Server sets a `session_id` cookie on first visit (UUIDv4). Like/Unlike mutations include this session ID. One row per `(content_id, session_id)` — toggle insert/delete. No user accounts.

### AD-4 — Single contents table with type discriminator

- **Binds:** Content schema and all queries
- **Prevents:** Separate tables for mantras vs stotras (redundant schema), inconsistent query paths
- **Rule:** `contents` table has a `type` column (`'mantra' | 'stotra'`). Both types share exactly the same columns (title, deity_id, sanskrit_text, transliteration, translation, tags_json, status, slug). The type drives UI rendering only (layout density, line count).

### AD-5 — SSR for content pages; static for admin

- **Binds:** Route render mode
- **Prevents:** Content pages missing SEO HTML; admin pages wasting server resources
- **Rule:** `/mantra/{slug}`, `/stotra/{slug}`, `/deity/{slug}` use TanStack Start SSR (`server: { render: 'ssr' }`). Homepage, `/admin/*`, `/saved` use pre-rendered static output.

### AD-6 — Visitors don't need accounts

- **Binds:** Every visitor surface
- **Prevents:** Auth gates on visitor features; user data collection
- **Rule:** No sign-up, no login, no profile for visitors. All personalization (saves, likes) uses browser localStorage + anonymous session. No PII collection.

## Consistency Conventions

| Concern | Convention |
|---|---|
| Naming (files) | kebab-case for files, PascalCase for components |
| Naming (routes) | File-based TanStack Router: `/deity/$slug`, `/mantra/$slug` |
| Data (ids) | Auto-increment integer primary keys in SQLite |
| Data (dates) | ISO 8601 strings (created_at, updated_at) |
| Data (slugs) | Lowercase kebab-case, unique per content type |
| State (errors) | TanStack Query error boundary per feature section |
| State (config) | Environment variables via `process.env` (VITE_ prefix for public) |
| API (data) | TanStack Start server functions, not REST routes |

## Stack

| Name | Version |
|---|---|
| @tanstack/react-start | ~1.168.x |
| @tanstack/react-router | ~1.170.x |
| @tanstack/react-query | ~5.100.x |
| @clerk/tanstack-react-start | ~1.4.x |
| @tiptap/core (react) | ~3.28.x |
| drizzle-orm | ~0.45.x |
| better-sqlite3 | ~11.x |
| Node.js | >=20.9.0 |
| TypeScript | ~5.x |
| Vite | ~6.x |
| Tailwind CSS | ~4.x |

## Structural Seed

```
sacredspace/
  app/
    routes/
      index.tsx                  # Home — static
      _visitor/
        deity.$slug.tsx          # God detail — SSR
        mantra.$slug.tsx         # Mantra detail — SSR
        stotra.$slug.tsx         # Stotra detail — SSR
        search.tsx               # Search — static
        saved.tsx                # Saved — static
      _admin/
        admin/
          index.tsx              # Clerk login
          dashboard.tsx          # Content management
          create.tsx             # New content
          edit.$id.tsx           # Edit content
          categories.tsx         # Category management
          analytics.tsx          # Analytics dashboard
    server/
      db/
        schema.ts               # Drizzle schema (contents, deities, likes)
        index.ts                 # DB client (SQLite via better-sqlite3)
      functions/
        contents.ts              # Server functions: get, list, search, create, update, delete
        deities.ts               # Server functions: list deities
        likes.ts                 # Server functions: toggle like, get counts
  lib/
    common/
      components/
        god-card.tsx
        mantra-card.tsx
        search-bar.tsx
        heart-button.tsx
      types.ts
      query-keys.ts
```

## Capability → Architecture Map

| Capability / Area | Lives in | Governed by |
|---|---|---|
| Homepage | `routes/index.tsx` + `features/visitor/home/` | AD-5, AD-6 |
| Deity detail | `routes/_visitor/deity.$slug.tsx` + `features/visitor/deities/` | AD-1, AD-5 |
| Mantra/Stotra detail | `routes/_visitor/mantra.$slug.tsx` + `features/visitor/mantras/` | AD-1, AD-5, AD-2 |
| Search | `routes/_visitor/search.tsx` + `features/visitor/search/` | AD-1, AD-6 |
| Saved | `routes/_visitor/saved.tsx` + `features/visitor/saved/` | AD-1, AD-6 |
| Admin content mgmt | `routes/_admin/admin/dashboard.tsx` + `features/admin/dashboard/` | AD-1, AD-5 |
| Admin editor | `routes/_admin/admin/create.tsx` + `features/admin/editor/` | AD-1, AD-5 |
| Admin analytics | `routes/_admin/admin/analytics.tsx` + `features/admin/analytics/` | AD-1, AD-5 |

## Deferred

- **Comments on mantras** — not in scope. Could use a `comments` table later if needed.
- **User accounts** — deferred. If needed, Clerk handles it with minimal migration.
- **Audio chanting** — the Stitch export included an audio player. Add when audio files exist.
- **Onboarding flow** — designed in UX, implement when visitor retention data shows need.
- **Ritual guides** — designed in UX, add as a `content` type extension when content is ready.
- **Multi-language** — deferred. All text is Sanskrit + English for now.
