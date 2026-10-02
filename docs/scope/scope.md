# Scope: SacredSpace

A progressive web app for exploring Sanskrit mantras and stotras, for anyone who wants to read, listen to, and collect Vedic chants. This scope enrolls what already ships (brownfield) and plans the next slice on top of it.

**Build approach:** Tracer Bullet (each feature ships end to end through every layer, working when it lands).
**Workflow:** Beta (after /develop: /check verify, then /test; a risky feature can carry a `· GA` tag to add /check review + /document).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Project scaffold | Foundation | existing |
| 2 | Deity directory & homepage | Foundation | existing |
| 3 | Mantra & stotra reader | Foundation | existing |
| 4 | Search & filtering | Foundation | existing |
| 5 | Admin dashboard | Foundation | existing |
| 6 | Admin TipTap editor | Foundation | existing |
| 7 | Like system | Foundation | existing |
| 8 | Admin analytics | Foundation | existing |
| 9 | Saved collection | Foundation | existing |
| 10 | CI pipeline & preview gates | Foundation | existing |
| 11 | Auth hardening & e2e canary | Foundation | existing |
| 12 | FTS5 full-text search | Slice 1 | done |
| 13 | Content authoring at scale | Slice 1 | planned |
| 14 | Offline reading & sync | Slice 1 | planned |
| 15 | Notification & reminder surfaces | Slice 2 | planned |
| 16 | Collections & sharing | Slice 2 | planned |
| 17 | Keyset pagination & infra hardening | Slice 2 | planned |

## Enrolled: already shipped

The features below predate the workflow. They are enrolled for context only; `/develop` and `/sync` never touch `existing` rows.

### 1. Project scaffold · existing
TanStack Start v1.168 + React 19 + Tailwind v4, Nitro/Vercel preset, PWA service worker. code in `sacredspace/src/`

### 2. Deity directory & homepage · existing
God cards grid, deity detail pages, responsive layout, daily mantra pick, dynamic Satori OG images. code in `sacredspace/src/routes/`

### 3. Mantra & stotra reader · existing
Three view modes (Sanskrit, transliteration, translation), font controls, audio player, like/save/share action bar. code in `sacredspace/src/routes/mantra.$slug.tsx`

### 4. Search & filtering · existing
Search bar with deity filter chips; SQL `LIKE` matching (FTS5 is planned below). code in `sacredspace/src/routes/search.tsx`

### 5. Admin dashboard · existing
Clerk-gated, role-authorized content management with publish status and pagination. code in `sacredspace/src/routes/admin.dashboard.tsx`

### 6. Admin TipTap editor · existing
Rich-text CRUD for mantras and stotras with Devanagari support and server-side sanitization. code in `sacredspace/src/routes/admin.editor.$slug.tsx`

### 7. Like system · existing
Database-backed anonymous likes deduped per session, with engagement analytics. code in `sacredspace/src/server/functions/likes.ts`

### 8. Admin analytics · existing
Likes engagement charts and content metrics. code in `sacredspace/src/routes/admin.analytics.tsx`

### 9. Saved collection · existing
Anonymous, device-local bookmarks via localStorage. code in `sacredspace/src/routes/saved.tsx`

### 10. CI pipeline & preview gates · existing
GitHub Actions CI, Dependabot, Vercel preview deploys. code in `.github/workflows/ci.yml`

### 11. Auth hardening & e2e canary · existing
Role-based admin authorization on all admin server functions, signed-in/out e2e coverage. code in `sacredspace/e2e/auth.spec.ts`

## Slice 1: Content depth

### 12. FTS5 full-text search · done
Replace `LIKE` search with SQLite FTS5 so transliterations, translations, and Sanskrit text match as the library grows.
**Done when:** searching a partial or transliterated term returns ranked results across title, transliteration, and translation; draft content stays excluded.
- [x] Design it (spec): `/architect FTS5 full-text search`
- [x] Build it: `/develop FTS5 full-text search`
   - [x] Filter drafts from the FTS MATCH query (AC-3)
   - [x] Filter drafts from the listing and LIKE fallback, guard the whitespace only query (AC-3, AC-6)
   - [x] Tests: draft exclusion, filter and sort combinations, MATCH metacharacters, whitespace input (AC-3, AC-4, AC-6)
- [x] Verify it: `/check verify FTS5 full-text search`
- [x] Test it: `/test FTS5 full-text search`
Spec [0001](../specs/0001-fts5-content-search/index.md) · code in `sacredspace/src/server/functions/contents.ts`

### 13. Content authoring at scale · needs a decision
Bulk import (CSV or markdown) and bulk status changes in the admin panel, so the library can grow past hand entry.
**Done when:** an admin can import a batch of mantras with deities set, review them as drafts, and publish in bulk without the editor.
- [ ] Design it (spec): `/architect content authoring at scale`

### 14. Offline reading & sync · needs a decision
The app is a PWA; make saved mantras readable offline and sync likes/saves made offline.
**Done when:** a saved mantra opens without a network connection, and offline actions reconcile when back online.
- [ ] Design it (spec): `/architect offline reading & sync`

## Slice 2: Habit & growth

### 15. Notification & reminder surfaces · needs a decision
Bring users back: a reminder channel for the daily mantra (push, email, or calendar links, decided in the spec).
**Done when:** a user can opt in to a daily reminder and receives it through the chosen channel.
- [ ] Design it (spec): `/architect notification & reminder surfaces`

### 16. Collections & sharing · needs a decision
Let users group saved mantras into named collections and share one publicly as a read-only page.
**Done when:** a user can create a collection, add mantras, and open its public share link logged out.
- [ ] Design it (spec): `/architect collections & sharing`

### 17. Keyset pagination & infra hardening · needs a decision
Move public listing endpoints from offset pagination to keyset, set explicit Turso/LibreSQL backup policy, and check FTS index size.
**Done when:** public lists stay fast at 10k+ rows, and backups are documented and scheduled.
- [ ] Design it (spec): `/architect keyset pagination & infra hardening`

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first. The tag drops once the spec is captured.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· GA`) sets that feature's rigor above the Beta default; no tag inherits the default.
- **Pointer line** (`spec <n>` · `code in <path>`): the spec link is added by `/architect` at capture, the code path by `/develop`.

_Statuses on rows 1 to 11 record that these predate the workflow: complete and shipped. They are context, not work._
