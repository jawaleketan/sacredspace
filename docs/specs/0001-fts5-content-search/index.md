# 0001. FTS5 content search

**Date**: 2026-09-30
**Status**: Accepted

## Summary

Public search runs on SQLite FTS5 (the full text search engine built into SQLite) inside the existing libSQL/Turso database, with no new infrastructure. It ranks results with BM25 (a relevance scoring function) across title, description, transliteration, and translation, and falls back to a plain LIKE search if the index ever fails. This spec documents the shipped decision and carried one small fix to build: drafts must be excluded from public search results. That fix has landed in code and tests; the running app check remains with /check verify.

## Requirements

**User stories**:
- As a visitor, I want to search by word or phrase and get relevant results across the title, the description, the transliteration, and the translation, so I can find a chant even when I only know how it sounds.
- As a visitor, I want partial words to match, so typing "gan" finds "Ganesha".
- As an editor, I want unpublished drafts to stay invisible in public search, so I can prepare content before it is ready.
- As a visitor, I want deity and type filters to narrow a search, and results sorted by relevance or by date.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: A query term drawn from any of the four indexed columns (title, description, transliteration, translation) returns the matching published content; multi word queries rank by BM25 relevance.
- **AC-2**: A partial final term matches by prefix ("gan" matches "Ganesha").
- **AC-3**: Content with status draft never appears in public search results, in the FTS path or the LIKE fallback, with or without filters.
- **AC-4**: User input cannot inject FTS query syntax: terms are quoted and star suffixed by `buildFtsQuery`, so NOT, OR, NEAR, and column filters in user input are inert text.
- **AC-5**: If the FTS machinery fails (index missing, engine error), search still returns results through the LIKE fallback with the same row shape, and the request does not error.
- **AC-6**: Deity and type filters compose with a text query on both paths, and sort newest (by created_at) versus relevance or title works on the text query paths (the no query listing stays title ordered, its shipped behavior).

## Decision

**Chosen option**: Option 2: SQLite FTS5 external-content index

Public search is a `contents_fts` FTS5 virtual table inside the existing database, kept in sync with the contents table by insert, update, and delete triggers plus a startup rebuild, queried with BM25 ranked MATCH over the four indexed columns, with a LIKE fallback for resilience. Drafts are filtered out of every public path: `AND c.status = 'published'` on the FTS query, `eq(contents.status, 'published')` in the Drizzle where clause shared by the listing and the fallback, and a guard that sends a query which trims to empty to the listing path instead of an empty MATCH argument.

## Feature design

**Data model sketch**:

No base table changes. The search surface is the virtual table and its sync machinery:

| Object | Definition | Notes |
|---|---|---|
| `contents_fts` | FTS5 virtual table, columns title, description, transliteration, translation, `content='contents'`, `content_rowid='id'` | External content: references live rows, does not duplicate bodies |
| Sync triggers | `contents_fts_insert` (AFTER INSERT), `contents_fts_delete` (AFTER DELETE, delete command), `contents_fts_update` (AFTER UPDATE, delete then insert) | Copied from the SQLite FTS5 external-content docs |
| Startup rebuild | `INSERT INTO contents_fts(contents_fts) VALUES ('rebuild')` on every cold start, after migrations, before traffic | Covers pre index rows and any writer that bypassed triggers |

The indexed column set is a decision: it deliberately excludes `body` (the full Sanskrit text, large and HTML formatted) and includes the four columns a visitor can realistically search. Changing the column set later means dropping and recreating the virtual table, so it is pinned here.

**State transitions** (if applicable):

Not applicable. Search is a pure read path over the existing content lifecycle (draft to published, handled in the admin functions).

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `searchContents` (server function, GET) | GET | query: string (optional), deitySlug: string (optional), type: "mantra" or "stotra" (optional), sortBy: "alpha" or "newest" | Array of results: id, title, slug, type, description, deityId, deityName, deitySlug | Public, rate limited (120 per minute per IP) | 429 from the limiter; never a raw FTS error (falls back to LIKE) |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| searchContents with a query | Matched published rows | `contents_fts MATCH` over the FTS query string that `buildFtsQuery` derives from the query input param, joined to contents and deities |
| searchContents with a query | Result order (default) | The FTS5 rank column (BM25), then title (COLLATE NOCASE) |
| searchContents with a query | Result order (newest) | `contents.created_at` column, descending |
| searchContents without a query | Filtered listing ordered by title | `contents.title` column (sort param not applied on this path, by decision) |
| both paths | deityName, deitySlug | deities join on `contents.deity_id` |
| both paths | Type filter | type input param, matched against `contents.type` |
| both paths | Deity filter | `deities.id` resolved from the deitySlug input param |
| both paths | Draft exclusion | `contents.status` column, constant "published" (built: filter landed on all three paths) |
| result count in the UI | Number of results | Derived from the returned array (results.length) |

**Key invariants**:

- Public search returns published rows only, on every path (FTS, LIKE fallback, and the no query listing). AC-3 makes this checkable; it is the invariant every other public read already follows.
- The MATCH argument is always produced by `buildFtsQuery` (each whitespace separated term double quoted, internal quotes stripped, star suffixed). Raw user input never reaches MATCH.
- A query that trims to empty is treated as no query: it takes the filter listing path, never an empty MATCH argument.
- The index stays consistent with the contents table: triggers cover writes, the startup rebuild covers everything else. A rebuild failure logs and search falls back to LIKE rather than failing boot.
- The fallback returns the same row shape as the FTS path, so callers cannot tell which path answered.

**Security model**:

Public read, unauthenticated, rate limited at 120 requests per minute per IP (the shared public limiter, Upstash backed when configured). Search input is untrusted: the query builder neutralizes MATCH syntax, filters are parameterized, and result rendering stays inside the existing sanitization rules (descriptions are plain text fields; the rich body field is never returned by search). No personal data flows through search beyond the anonymous result rows themselves. Compliance scope: none.

**Configuration required**:

None. The index lives in the database, needs no credentials or environment variables, and the fallback removes any hard dependency on the FTS extension being available.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: search a term drawn from each of the four indexed columns on the seeded library; matching published rows come back, multi word queries rank plausibly, verifies **AC-1**, **AC-2**
- Failure case: force the FTS machinery to fail (drop the virtual table or error the MATCH) and confirm the LIKE fallback returns same shaped results without a 500, verifies **AC-5**
- Visibility: insert a draft row, confirm it appears in neither the FTS path nor the fallback nor the no query listing, verifies **AC-3**
- Security: submit MATCH metacharacters as the query (NOT, OR, NEAR, column filters, embedded quotes) and confirm safe results or an empty set, never a syntax error surfaced to the visitor, verifies **AC-4**
- Edge: submit a whitespace only query and confirm it is treated as the no query listing path, never an empty MATCH argument, verifies **AC-6**

## Build plan

The feature shipped on 2026-09-12; the published filter work below landed on 2026-09-30 as one thin vertical slice through the visibility rule (query paths, tests, live check) per the project's Tracer Bullet approach. The schema is untouched, so no migration was needed.

- [x] Add the published filter to the FTS path in `searchContents`: append `AND c.status = 'published'` to the filter SQL built for the MATCH query, satisfies **AC-3**
- [x] Add the published filter to the no query listing and the LIKE fallback: extend the Drizzle where clause with `eq(contents.status, 'published')`, and guard the whitespace only query (a query that trims to empty takes the listing path), satisfies **AC-3**, **AC-6**
- [x] Extend the contents test suite: the published filter in the FTS SQL, filter and sort combinations over the FTS path, MATCH metacharacter inputs through `buildFtsQuery`, and whitespace only query routing, satisfies **AC-3**, **AC-4**, **AC-6** (a behavioral draft row test needs a real database, covered by the verify step below)
- [x] Verify on the running app: search a partial and a full term, apply deity and type filters, confirm drafts stay hidden and the fallback path answers when the index is unavailable, satisfies **AC-1**, **AC-2**, **AC-5** (verified 2026-09-30 against the live app and its Turso database; the optional dropped index drill was not run, AC-5 is covered by the fallback suite)

## Consequences

**Positive**:
- Ranked, prefix capable search across title, description, transliteration, and translation, with zero new infrastructure and zero new credentials.
- Search survives index failure: the fallback answers every request, degraded but present.
- Public search input is injection safe by construction, pinned by tests.
- Drafts can no longer leak into public search; the invariant is enforced on all three paths and pinned in the test suite.

**Negative / tradeoffs**:
- Every cold start reindexes the whole library before serving traffic; harmless at hundreds of rows, a real cost at tens of thousands (the Follow-up names the threshold to revisit).
- The FTS query is raw SQL beside Drizzle's typed builder; a schema change to the indexed columns must update the virtual table, the triggers, and the query text together, and only tests will catch a miss.
- Fallback results are visibly weaker (two columns, no ranking), so a visitor may see different quality right after an index failure with no signal that anything changed.

**Neutral**:
- The three triggers add a small write amplification to every content insert, update, and delete, including admin bulk work.
- The index lives inside the database file, so it rides along with database backups and needs no separate lifecycle.

## Follow-up

- [ ] Revisit the startup rebuild when the library passes a few thousand rows (incremental inserts or the FTS5 optimize command, and consider tying it to scope feature 17, keyset pagination and infra hardening)
- [ ] Search results are unbounded (no LIMIT clause); harmless at this library size, add a limit or keyset window when scope feature 17 lands
- [ ] docs/ARCHITECTURE.md still lists "Search uses LIKE" as a known gap; it is stale since 2026-09-12 and should be corrected
- [ ] sacredspace/AGENTS.md does not mention the FTS machinery or its raw SQL rule; worth one line when /sync next runs

## Rationale

Reasoning and options: see [rationale.md](./rationale.md).
