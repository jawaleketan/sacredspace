# Rationale: bulk content authoring

## Context

Feature 13 on the scope is content authoring at scale. The library today grows one mantra at a time through the TipTap editor, which was fine for the seed set and becomes the bottleneck once real source material (transliterations, translations, Sanskrit texts) arrives in batches. The done-when on the scope row: an admin can import a batch of mantras with deities set, review them as drafts, and publish in bulk without the editor.

Forces that shaped this design:

- The project is a one developer TanStack Start app on Vercel with a libSQL/Turso database. There is no queue, no worker, no cron. Anything built must run inside a request.
- The admin panel already has the review surface: a dashboard table with status filters and pagination, and a per row editor. Imported rows that land as drafts slot straight into it.
- Server conventions are settled and strict: Zod validated inputs, typed AppError classes, Clerk plus role gated admin writes, rate limiting everywhere, and server side sanitization of HTML. A bulk importer is exactly the kind of feature where those conventions earn their keep, because CSV is hostile untrusted input.
- The content model (deities, contents with a draft/published status) already covers everything an imported row needs. The importer is a producer of rows, not a new domain.

## Options considered

### Option 1: Direct insert with post import cleanup

Upload or paste, insert immediately as drafts, then find and fix problems in the dashboard or editor.

**Pros**:
- The smallest build: one server function, no preview UI.
- Progress is instant; there is no confirm step to slow an admin down.

**Cons**:
- A wrong column mapping writes 300 junk rows that must be deleted by hand, one at a time, because the importer deliberately has no bulk delete.
- Bad rows surface only after they exist, which is the opposite of what a one person team needs at import time.
- The done-when says review before publish, and this defers review until after the write.

### Option 2: Stateless preview then confirm, reusing the contents table

Two admin functions over the same raw CSV text: preview parses and validates, reporting per row problems with row numbers, and writes nothing; confirm revalidates from the raw text and inserts the valid batch as drafts in one transaction, skipping and reporting slug duplicates. Bulk publish and unpublish are checkbox actions on the existing dashboard table, capped at 100 ids per call.

**Pros**:
- Mapping mistakes die in the preview, where they cost nothing.
- All or nothing plus a transaction means the library never holds half a batch, and repeatable imports (skip and report) let a corrected file be re-run safely.
- No new schema, no cleanup lifecycle, no state machine beyond the content status that already exists.

**Cons**:
- Two functions and a preview table are more UI than a direct insert.
- Parsing the CSV twice (preview and confirm) is accepted duplicated work, the price of never trusting client supplied parsed rows.
- The 500 row ceiling and in-request execution bound batch size; very large libraries import in several passes.

### Option 3: Staging table with a persisted import session

Parse once into a staging table, review over multiple visits, then promote the batch to contents on confirm.

**Pros**:
- Preview state survives refreshes and long review sessions.
- Per row edit or drop inside the import flow becomes possible.

**Cons**:
- A migration, a session lifecycle, cleanup of abandoned imports, and an index against half dead staging rows. For a 500 row paste, the complexity buys almost nothing.
- Two sources of truth for content in draft, which invites drift bugs.

### Option 4: Markdown files with frontmatter

Accept one document per item (frontmatter plus body), a format comfortable for long texts and git friendly.

**Pros**:
- Long stotras read naturally as documents; the files diff well in version control.

**Cons**:
- A second parser and a looser contract (frontmatter dialects, markdown to HTML conversion or raw HTML inside markdown, both messy).
- Bulk source material in the real world is tabular exports, not one file per chant.

## Rationale

Option 2 wins on the shape of the risk, not on feature count. The dangerous failure here is silent: a mapping mistake that writes hundreds of wrong rows. Options 1 moves that failure after the write, and Option 3 spends a migration and a lifecycle to defend against a problem the preview solves for free. Option 4 optimizes authoring ergonomics this project does not have yet; the inputs are exports, and CSV with a proven parser (papaparse, RFC 4180 quoting for HTML bodies with commas and newlines) matches them.

Reusing the contents table is the load bearing call: imported rows are ordinary content, so drafts get the existing review surfaces, the existing public read filtering, and the draft visibility tests spec 0001 pinned, all for free. Confirm carrying raw CSV text rather than client parsed rows follows the trust boundary rule, the server revalidates from raw input and never trusts client transformed data, and costs only a second parse. The 500 row and 100 id caps keep everything inside one serverless request; a background job system would lift the ceiling, and is deliberately not built for a batch size the preview flow makes comfortable. The engineer confirmed every element of this design stage by stage; papaparse and the sources level references were the only delegated calls, and both are recorded here.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md` and `sacredspace/AGENTS.md`: the admin write conventions (Clerk gating, role checks, rate limits, Zod validators, typed errors) this design follows
- Spec 0001 (`docs/specs/0001-fts5-content-search/`): the drafts excluded from public reads invariant and its test coverage
- `sacredspace/src/server/functions/contents.ts`, `validators.ts`, and the dashboard routes: the content shape and admin UI patterns this feature extends
- `docs/scope/scope.md` feature 13: the done-when this spec is built to satisfy

**Practices & standards**:
- RFC 4180 CSV quoting, the standard the parser choice rests on
- Preview then confirm for bulk writes, show the effect before it lands, all or nothing transaction
- Trust boundary rule: never trust client transformed data, revalidate from raw input server side
