# Verify: FTS5 full-text search · spec 0001 · updated 2026-09-30

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Search `gayatri` on the running app → 7 ranked published results (BM25 order, not alphabetical), no draft rows → AC-1, AC-3 (verified 2026-09-30, dev server against Turso)
- [x] Search a partial word (`gan`) → prefix matches (Ganesha titles) → AC-2 (verified 2026-09-30)
- [x] Set one real row to draft, search its marker → hidden (raw index shows it, app returns 0); publish it → appears (browser and SSR agree); delete it → gone from index → AC-3 (verified 2026-09-30 via a probe row toggled at the data layer against Turso, the DB the app serves from; the Clerk-gated admin UI click through itself remains for a future e2e)
- [x] Apply a type chip and deity chips with a query → results narrow, count line updates (0 for gayatri+stotra, 1 for gayatri+Ganesha, 0 for gayatri+Shiva) → AC-6 (verified 2026-09-30 via the same URL search params the chips set)
- [x] Sort Newest with a query → order flips to newest first (matched the DB's expected order); without a query the listing stays title ordered → AC-6 (verified 2026-09-30)
- [x] Search only spaces (`   `) → behaves as the browse listing, 17 title ordered results, no error → whitespace invariant (verified 2026-09-30)
- [x] Search `NOT OR NEAR` and `title:om` → treated as literal terms, clean 0 result empty states, no syntax error; a quote/semicolon payload also returns 200 → AC-4 (verified 2026-09-30)

## Commands

- [x] `cd sacredspace && npm run typecheck` → clean (verified 2026-09-30 during the build)
- [x] `cd sacredspace && npm test` → 97/97 across 11 files, including the `searchContents FTS query path` suite: the published filter in the FTS SQL, filter/sort arg composition, whitespace routing, fallback shape → AC-3, AC-4, AC-6; AC-5's fallback branch is executed by the suite with a rejecting DB client mock (the dropped index drill below was not run)
- [ ] Optional, local only: copy the dev DB, drop its `contents_fts` table, point the dev server at the copy, search → LIKE fallback answers with the same row shape, no 500 → AC-5 (not run; it needs a throwaway copy since the dev server points at the shared Turso database)

## Acceptance-criteria coverage

- AC-1 → manual search `gayatri`; commands suite rank ordering
- AC-2 → manual partial `gan`
- AC-3 → admin draft toggle manual step; SQL assertion `AND c.status = 'published'`; listing/fallback where clause
- AC-4 → `NOT OR NEAR` / `title:om` manual steps; `buildFtsQuery` metacharacter tests
- AC-5 → optional dropped index step; fallback-shape test with rejecting execute mock
- AC-6 → chip filter and sort manual steps; filter/sort composition test (`AND c.type = ?`, `AND c.deity_id = ?`, `c.created_at DESC`, arg order)
