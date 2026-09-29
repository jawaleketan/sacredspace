# Verify: FTS5 full-text search · spec 0001 · updated 2026-09-30

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Search `gayatri` on the running app → matching published results appear, ranked; no draft rows → AC-1, AC-3
- [ ] Search a partial word (`gan`) → prefix matches (Ganesha titles) → AC-2
- [ ] In admin, set one content row to draft, then search its exact title → it stays hidden; publish it → it appears → AC-3
- [ ] Apply a deity chip and a type chip with a query → results narrow, the count line updates → AC-6
- [ ] Sort Newest with a query → order flips to newest first; without a query the listing stays title ordered → AC-6
- [ ] Search only spaces (`   `) → behaves as the browse listing, no error → whitespace invariant
- [ ] Search `NOT OR NEAR` and `title:om` → treated as literal terms, no syntax error surfaced → AC-4

## Commands

- [ ] `cd sacredspace && npm run typecheck` → clean → all ACs (build health)
- [ ] `cd sacredspace && npm test` → all pass, including the `searchContents FTS query path` suite: the published filter in the FTS SQL, filter/sort arg composition, whitespace routing, fallback shape → AC-3, AC-4, AC-5, AC-6
- [ ] Optional, local only: copy the dev DB, drop its `contents_fts` table, point the dev server at the copy, search → LIKE fallback answers with the same row shape, no 500 → AC-5

## Acceptance-criteria coverage

- AC-1 → manual search `gayatri`; commands suite rank ordering
- AC-2 → manual partial `gan`
- AC-3 → admin draft toggle manual step; SQL assertion `AND c.status = 'published'`; listing/fallback where clause
- AC-4 → `NOT OR NEAR` / `title:om` manual steps; `buildFtsQuery` metacharacter tests
- AC-5 → optional dropped index step; fallback-shape test with rejecting execute mock
- AC-6 → chip filter and sort manual steps; filter/sort composition test (`AND c.type = ?`, `AND c.deity_id = ?`, `c.created_at DESC`, arg order)
