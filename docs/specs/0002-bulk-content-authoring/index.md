# 0002. Bulk content authoring

**Date**: 2026-10-03
**Status**: Proposed

## Summary

Admins will import many mantras and stotras at once by pasting or uploading a CSV, seeing a row by row preview that names every problem before anything is written, then confirming to land the whole batch as drafts in one transaction. The admin dashboard gains checkboxes with bulk publish and unpublish, so a reviewed batch goes live without opening each item in the editor. Nothing new is invented for the data: imported rows are ordinary content rows, and the library grows through the same publish path the editor already uses.

## Requirements

**User stories**:
- As an admin, I want to import a batch of mantras from a CSV so the library can grow past hand entry.
- As an admin, I want to see a row level preview that names every problem before anything is written, so a bad mapping never reaches the database.
- As an admin, I want imported rows to land as drafts, so I can review them with the tools that already exist.
- As an admin, I want to publish or unpublish many items at once from the dashboard, so a reviewed batch goes live without opening each one in the editor.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: An admin can paste CSV text or choose a CSV file (up to 500 rows) on a new admin import page, and a preview renders before any write happens; the preview alone writes nothing to the database.
- **AC-2**: Every row is validated against the full content contract and the preview names the exact problem per row (missing required column, unknown deity, bad type, slug collision, duplicate inside the batch, oversize body).
- **AC-3**: Confirm runs all or nothing: it is blocked while any listed row is invalid, inserts the valid batch in one transaction, and every inserted row lands with status draft.
- **AC-4**: Rows whose slug already exists are skipped and reported, never overwritten; the first of repeated rows inside one CSV wins and later repeats are reported the same way.
- **AC-5**: Deities are matched against existing deities only, by slug first then by name; a row naming no existing deity is invalid and reported, and no deity row is ever created by the importer.
- **AC-6**: The dashboard table gains per row checkboxes with a bulk bar offering Publish selected and Set to draft, operating on at most 100 selected rows per action, with the result confirmed in a toast.
- **AC-7**: Every admin surface this feature adds (import preview, import confirm, bulk status) requires a signed in admin role, validates input with Zod, is rate limited, and sanitizes imported HTML bodies server side with the existing sanitize-html path.

## Decision

**Chosen option**: Option 2: Stateless preview then confirm, reusing the contents table

The importer is two admin server functions over raw CSV text: `previewImport` parses and validates, returning a per row report with row numbers and reasons and writing nothing; `confirmImport` takes the same raw CSV text, revalidates from scratch, and inserts the valid batch as drafts inside one transaction, skipping and reporting slug duplicates. Bulk status changes are one admin function, `bulkSetStatus`, taking up to 100 content ids and a target status of published or draft. The UI is a new `admin.import` route (paste box plus file input feeding the same text, then the preview table and confirm) and a checkbox column with a bulk bar on the existing dashboard table. No new tables, no new columns, no background jobs: imports execute inside the request.

**Implementation skills**: none used; the design rests on the project's own AGENTS.md conventions and the installed JSMastery workflow skills.

## Feature design

**Data model sketch**:

No schema changes. The import targets the existing tables:

| Table | Use | Notes |
|---|---|---|
| `contents` | Every imported row inserts here with `status = 'draft'` | Columns set from CSV: title, slug, type, description, transliteration, translation, body; `deity_id` resolved from the deity match; server defaults fill timestamps |
| `deities` | Read only during import | Matched by slug first, then by exact name; never written by the importer |

CSV contract: columns `title`, `type`, `deity`, `body` required; `slug`, `description`, `transliteration`, `translation` optional. A header row is required and column order does not matter. The CSV text is capped at 4,000,000 characters total (just under the platform request body ceiling), and a file upload is decoded as UTF-8 with a leading BOM stripped before parsing, so Excel exports do not silently mangle Devanagari text. The slug is derived from the title (same rules as the editor) unless the optional `slug` column overrides it. `body` carries HTML as stored, and passes through the existing server side `sanitize-html` path on insert. The `type` value must be `mantra` or `stotra`.

**State transitions**:

The existing content lifecycle, unchanged. Import creates rows in the `draft` state. Bulk actions move rows `draft → published` and `published → draft`. The editor, dashboard pagination, and status filter continue to work on imported rows with no special casing.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `previewImport` (server function) | POST | csvText: string (req) | rows: parsed row reports with row numbers, validity, and per row reason; summary counts | Admin role | 401 not signed in, 403 wrong role, 429 rate limited, 422 CSV over limits or unparseable |
| `confirmImport` (server function) | POST | csvText: string (req) | imported: number, skipped: report rows with reasons | Admin role | 401, 403, 429, 422, and the all or nothing rule: confirm refuses while any row is invalid (422 with the same report) |
| `bulkSetStatus` (server function) | POST | ids: number[] up to 100 (req), status: "published" or "draft" (req) | updated: number | Admin role | 401, 403, 429, 422 empty list, over cap, or bad status |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| previewImport / confirmImport | Parsed rows | The csvText input param, parsed with papaparse (RFC 4180, comma separated with delimiter auto detection so Excel dialects work), header row required |
| both | Row validity and per row reason | Derived server side from the parsed row against the content contract (required columns, type enum, deity match, slug uniqueness, body cap), never trusted from the client |
| both | deity_id | `deities.id`, matched from the row's `deity` value by slug then exact name; a miss makes the row invalid (AC-5) |
| both | slug | Derived from `title` by the editor's existing slug rules, overridden by the row's optional `slug` column |
| both | Duplicate verdicts | `contents.slug` existing values for cross batch collisions; insertion order within the batch for the first wins intra batch rule (AC-4) |
| both | Row count, body, and text ceilings | Constant limits decided in this spec: 500 rows per import, 100000 characters per body, 4000000 characters of csvText total (request body ceiling enforced by the server function's Zod validator) |
| both | status at insert | Constant `"draft"` (decided in this spec) |
| confirmImport | Atomicity | One transaction (BEGIN/COMMIT) over the valid inserts; a failure rolls the whole batch back (AC-3) |
| bulkSetStatus | Rows updated | `contents.status` set for the id list in one UPDATE, count returned from the statement |
| all three | Authorization verdict | Existing `requireAdmin` check (Clerk session plus publicMetadata.role) |
| all three | Abuse protection | Existing admin rate limiter, `enforceRateLimit` with the admin limits |
| UI | Selection set for bulk actions | Dashboard checkbox state, capped at 100 per action |
| UI | Result feedback | Toast counts derived from the function returns (Imported N, skipped M with reasons; Published/Unpublished N items) |

**Key invariants**:

- The preview never writes. Only `confirmImport` inserts, and it revalidates from the raw CSV text rather than trusting any client supplied parsed rows.
- Confirm is all or nothing: while any listed row is invalid, confirm refuses; the insert batch is one transaction, so a mid batch failure leaves no partial import.
- The importer never updates or deletes an existing content row, and never creates a deity. Skips plus a report are the only overlap behaviors.
- Every imported row is born a draft; nothing imported is publicly visible until a separate bulk publish action by an admin.
- Imported HTML bodies pass the same server side sanitization as editor written bodies; no second sanitization path exists.
- Every surface is admin gated, Zod validated, and rate limited; the public site is untouched by this feature.

**Security model**:

Admin only, end to end. All three server functions sit behind the existing `requireAdmin` (401 signed out, 403 signed in without the admin role) plus the admin rate limiter. CSV text is untrusted input: parsed server side, size capped by the Zod validator, HTML bodies sanitized with the existing `sanitize-html` pipeline on insert. No public surface changes; drafts stay excluded from public reads everywhere, which spec 0001's suite already pins for search and the shared where clause covers for the rest.

**Critical test scenarios** (each maps to an acceptance criteria in ## Requirements):
- Happy path: paste a small valid CSV, preview shows all rows valid, confirm lands every row as draft and the toast reports the counts, verifies **AC-1**, **AC-3**
- Failure case: a batch containing one bad row (unknown deity or slug collision) shows the reason in preview, and confirm either refuses (invalid row) or inserts the rest while skipping and reporting the duplicate, never overwriting, verifies **AC-2**, **AC-4**, **AC-5**
- Auth/permission: a signed in user without the admin role calling previewImport, confirmImport, or bulkSetStatus receives 403 and nothing is written, verifies **AC-7**
- Bulk path: select a page of rows, Publish selected updates exactly those rows and the toast states the count, verifies **AC-6**

## Build plan

Ordered for the Tracer Bullet approach (the project default): stand up one thin end to end thread first, a paste in, preview, confirm, drafts visible in the dashboard loop, then thicken with file input, bulk actions, and hardening.

1. Add papaparse, write the shared CSV parsing and validation module (pure functions: parse, validate row, resolve deity, derive slug, produce per row reports), with unit tests covering quoted multiline HTML bodies, delimiter detection, and every rejection reason, satisfies **AC-1**, **AC-2**
2. Add `previewImport` (Zod validator, requireAdmin, admin rate limit) returning the row report without writing, plus tests for the 403 path and report shape, satisfies **AC-1**, **AC-2**, **AC-7**
3. Add `confirmImport` revalidating from raw CSV text, inserting valid rows as drafts in one transaction, skipping and reporting slug duplicates, plus tests for draft status, all or nothing refusal, skip and report, and the 403 path, satisfies **AC-3**, **AC-4**, **AC-7**
4. Build the `admin.import` route: paste box and file input feeding one text state, the preview table with per row reasons, and the confirm button wired to the real functions (empty, loading, and error states included), satisfies **AC-1**, **AC-2**
5. Add the checkbox column and bulk bar to the dashboard table with `bulkSetStatus` (cap 100) behind it, plus component tests for selection and the toast result, satisfies **AC-6**, **AC-7**
6. Wire a dashboard link to the importer and verify the whole loop end to end on the running app (import a probe batch, review as drafts, bulk publish, confirm public visibility, clean up), satisfies **AC-5**, **AC-6**

## Consequences

**Positive**:
- The library can grow in batches, and the done-when for feature 13 is met: import with deities set, review as drafts, publish in bulk without the editor.
- Reuse keeps the blast radius small: no schema change, no new auth, no new sanitization path, and the existing dashboard is the review surface.
- The raw text revalidation rule means a stale preview can never import stale rows.

**Negative / tradeoffs**:
- Imports run inside the request, so a full 500 row batch is bounded by serverless request limits; larger libraries import in several batches. A background job system would lift this, and is deliberately not built now.
- No audit trail: the import leaves no batch record, only the rows themselves and the toast report. An `import_batches` table would be the growth path if provenance ever matters.
- Duplicate handling is skip and report, so re-importing a corrected batch needs the duplicates removed or the slugs changed by hand.

**Neutral**:
- papaparse becomes a production dependency (small, stable, no runtime peer chain).
- The admin nav gains one entry; the dashboard table gains a checkbox column, which touch targets and keyboard reachability should cover.
- Confirm carrying raw CSV text instead of parsed rows doubles parse work per import, accepted as the price of never trusting the client.

## Rationale

See [rationale.md](./rationale.md) for context, options considered, and reasoning.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md` and `sacredspace/AGENTS.md`: server function patterns (Zod validators, typed AppError classes, Clerk gated admin writes, rate limiting, server side sanitize-html)
- Spec 0001 (`docs/specs/0001-fts5-content-search/`): the drafts stay out of public reads invariant and its test suite
- `sacredspace/src/server/functions/contents.ts` and `validators.ts`: the existing content shape, slug conventions, and validation patterns this feature extends

**Practices & standards**:
- RFC 4180 CSV quoting (quoted fields carrying commas and embedded newlines), the reason a proven parser is used
- Preview then confirm for bulk writes: show the effect before it lands, all or nothing transaction
- Trust boundary rule: the server revalidates from raw input and never trusts client transformed data
