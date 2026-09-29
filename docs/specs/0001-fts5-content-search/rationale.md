# 0001 rationale: FTS5 content search

Decision record for [0001](./index.md). Everything here is the WHY; /develop skips it.

## Context

The site serves a library of mantras and stotras that visitors search by keyword, deity, and type. The first implementation matched user input with SQL LIKE against the title and description columns. That returned substrings but no relevance ranking, and it could not see into the transliteration or translation columns where much of the searchable value lives.

The stack pins the design space: the database is a single SQLite file (local) or Turso (production), the app runs as serverless functions on Vercel, and the project runs on zero standing infrastructure besides the database. Any search engine that needs a second service (a dedicated search cluster, or a managed search product) would add a new system to operate, a new failure mode, and a new bill, for a library measured in hundreds of rows, not millions. The search feature shipped on 2026-09-12 (commit 9e2d320) took the SQLite native path: an FTS5 index stored inside the same database, kept in sync by triggers.

One gap remained in what shipped. The public search function (both the FTS path and the LIKE fallback) never filtered on the status column, so content saved as a draft could appear in public search results. Every other public read path filters drafts out; search must too. That fix is the build work this spec carried, landed 2026-09-30.

## Options considered

Options considered were not documented at decision time. The code and the fallback path imply the two realistic alternatives below; recorded as the best available account.

### Option 1: SQL LIKE substring matching

Match user input with LIKE against title and description. This is how search began, and it survives today as the fallback path.

**Pros**:
- Zero machinery: no index, no triggers, nothing to rebuild.
- Substring matching finds terms inside words without any configuration.

**Cons**:
- Scans the table on every query, so cost grows with the library.
- No relevance ranking; results are just ordered rows.
- Blind to the transliteration and translation columns unless more LIKE branches are stacked on, which multiplies the scan cost.

### Option 2: SQLite FTS5 external-content index (chosen)

A `contents_fts` virtual table (an index stored inside the same database file, using the external-content mode so it references the existing contents rows without copying them) over title, description, transliteration, and translation. Triggers keep it in sync on every insert, update, and delete, a rebuild runs at startup, and queries use MATCH with BM25 ranking.

**Pros**:
- Ranked, prefix capable search across all four valuable columns.
- Lives inside the database the app already runs: no new service, no new credentials, no new deployment surface. Backups include the index.
- Injection safe by construction: user input becomes quoted star suffixed terms, never raw MATCH syntax.

**Cons**:
- The startup rebuild reads and reindexes every row on each cold start; cheap now, grows with the library.
- The query runs as raw SQL through the libSQL client, outside Drizzle's typed query builder, so schema changes must keep the SQL text in sync by hand.
- The LIKE fallback silently degrades: it matches fewer columns and returns no ranking, so results differ between the happy and fallback paths.

### Option 3: A dedicated search service (managed product or separate engine)

Offload search to an external system (a hosted search API or a second database with its own index).

**Pros**:
- Mature relevance tuning, typo tolerance, and analytics out of the box at large scale.

**Cons**:
- A second system to operate, secure, and pay for, for a library of this size.
- Adds a sync problem (database to index) that FTS5's triggers solve for free, and a second place drafts could leak.

## Rationale

The decisive force is the stack itself: one SQLite database (local file in dev, Turso in production) on serverless functions, with no standing infrastructure to host a second search system. FTS5 delivers ranked multi column search inside the database the app already operates, which is exactly the boring, proven choice this project's scale calls for (basis: your AGENTS.md, the single database rule of the stack; the practice of choosing SQLite native features before adding services). The external-content mode matters specifically here: the index references the live rows instead of copying them, so storage stays lean and the trigger set follows the pattern the SQLite FTS5 external-content documentation recommends. The injection safe query builder exists because search input is untrusted public input; quoted, star suffixed terms make MATCH metacharacters inert, which the tests then pin down. The LIKE fallback keeps the failure mode graceful: if the index is ever absent or errored, search degrades to the older, weaker behavior instead of failing the request. The draft visibility gap was an oversight in the original commit, not a design flaw; every other public read path already filters drafts, and this spec carried the fix as its build work.

## References

**Project sources** (verifiable, in this repo):
- Commit 9e2d320, 2026-09-12: "feat: FTS5 content search, lang=sa accessibility, local dev detection fix"
- `sacredspace/src/server/db/index.ts`: the contents_fts virtual table, the trigger set, and the startup rebuild
- `sacredspace/src/server/functions/contents.ts`: buildFtsQuery, the FTS query path, and the LIKE fallback
- `sacredspace/src/server/__tests__/contents.test.ts`: the FTS test coverage, extended 2026-09-30
- `docs/scope/scope.md`: feature 12, the row this spec closes out

**Practices & standards**:
- SQLite FTS5 external-content tables (the official SQLite documentation's trigger pattern, cited by name, no link fetched)
- BM25 ranking as the FTS5 default relevance function
- Parameterized, quote neutralizing construction of untrusted search input (injection safe query building)
