# Session Notes

## 2026-09-16 — TypeScript 7 (native port): closed PR #8 revisited

The deliberately-deferred major is done. **Zero source changes** — the
entire migration is a package.json/lockfile swap. Verified: typecheck
identical results at **80.8s → 4.6s (18×)**, lint clean, 89/89 tests,
CI green on Linux (2m43s) including the production smoke job, prod
200 / health healthy.

### What breaks in TS 7, and what did (and didn't) hit us

1. **TS 7.0 ships no compiler API** (7.1 will, with a new shape). Tools
   that import the API — typescript-eslint — must stay on TS 6. The
   official answer is the side-by-side alias layout.
2. **7.0 adopts 6.0's defaults** (strict on, module esnext,
   moduleResolution nodenext/bundler only, es5/downlevelIteration are
   hard errors, new rootDir/types defaults) and promotes 6.0
   deprecations to hard errors. We were already on 6.0.3 with a
   7.0-clean tsconfig (strict, Bundler resolution, ESNext) — nothing
   to change.
3. **typescript-eslint@8.70 peers on typescript <6.1** — satisfied via
   the alias without touching the plugin.

### The migration (package.json)

- `"typescript": "npm:@typescript/typescript6@^6.0.2"` — the API that
  typescript-eslint resolves; also provides the `tsc6` binary.
- `"@typescript/native": "npm:typescript@^7.0.2"` — TS 7, which owns
  the `tsc` binary.

`"typecheck": "tsc --noEmit"` needed no change. CI passing on Linux
proves the platform-specific native binaries
(`@typescript/native-linux-x64-gnu` etc.) resolve from the lockfile
cross-platform.

### Notes for next session

- ~~Known transient: first `npm test` after a lockfile change shows
  8 files/56 tests~~ — investigated and fixed same day (see below):
  `scripts/test.cjs` discovery guard now fails any partial suite.
- When **TS 7.1** ships its API and typescript-eslint peers with 7.x,
  consolidate: drop the typescript6 alias, keep only typescript@7.
- Carry-overs below (Turso token revocation, Blob/Upstash vars, Clerk
  production keys, authenticated-flow click-through) still stand.

---

### Addendum (later same day): the 8/56 test-discovery transient

Never actually reproduced deliberately (cold-cache ×1, full reify ×2 —
all 11/89; CI logs show it never hit CI at all). Evidence-based
conclusion: both sightings followed installs that blew past the tool
timeout, so npm was still reifying node_modules while vitest collected,
and the piped grep output kept only the `passed` line — a partial suite
read as green. Fix is a wrapper, `scripts/test.cjs` (now the `test`
script): runs vitest with a JSON reporter, compares executed files
against `*.test.{ts,tsx}` on disk, exits 1 naming any dropped file.
Also catches silent discovery regressions (glob typos, renamed files).
Verified both ways: normal run green; a deliberately narrowed include
glob fails with all 4 dropped files named.

**Follow-up perf session (2026-09-16):** vitest reported jsdom environment
creation at 61% of suite time. Split into two projects — the two DOM
component suites run on `pool: "vmThreads"` (one jsdom per worker,
per-file module isolation kept); the nine node-env server/lib suites run
on the default threads pool with `environment: "node"`. Suite time:
~22s → ~12.4s locally, stable; CI green incl. production smoke. Pure
vmThreads everywhere was tried first and fails on Linux CI: admin.test.ts
→ sanitize-html → htmlparser2 ships ESM inside a CJS package, crashing
native vm loading ("Cannot use import statement outside a module");
`server.deps.inline` did not rescue it, hence the project split (the
subgraph never enters vmThreads now; verified no component imports it).
`isolate: false` was slower (~8s) and strictly less isolated — rejected.

## 2026-09-13 — Toolchain majors: vitest 5, jest-dom 7, jsdom 30, eslint 10, Clerk 1.5

All nine open Dependabot PRs from yesterday are now resolved. Every step
CI-gated; verified (typecheck ✅ · lint ✅ under eslint 10 · 89/89 tests ✅
under vitest 5 · CI + production smoke green · Clerk 1.5 live in prod).

### Completed

1. **Dependency-safe merge order**, each PR rebased onto current main and
   CI-green before merge: vitest 5 (#3, needed zero test changes) →
   jest-dom 7 (#4) → jsdom 30 (#7) → eslint 10 core (#6) → @eslint/js 10
   (#9, must follow core — it peers on eslint ^10). The PRs' earlier red
   CIs were the stale-main `errorComponent` typing fixed yesterday.
2. **Clerk 1.5 migration** (#5 closed as superseded; direct commit
   e10441f). Only two breaking changes for our small API surface:
   `SignedIn`/`SignedOut` components removed → `<Show when="signed-in">
   / <Show when="signed-out">`; `UserButton` no longer accepts redirect
   props at all — sign-out stays on the current page (equivalent to the
   old `afterSignOutUrl="/"` since the button lives on `/`). Runtime
   smoke tested locally (Clerk SSR bootstrap, /sign-in 200, health
   healthy, zero log errors) before push; CI + prod smoke green after.
3. **ESLint 10 caught a real bug**: its new `no-useless-assignment` rule
   flagged a dead `newTime` initializer in AudioProvider's keyboard
   seek handler — every switch arm reassigned or returned first. Fixed
   (fad2dff); now the codebase lints clean under the strict core.
4. **Final PR ledger** — merged: #1, #3, #4, #6, #7, #9, #11. Closed:
   #5 (superseded by the migration commit), #8 (TS 7 — deliberate later
   batch), #10 (superseded by #11).

### Notes for next session

- ~~TypeScript major~~ — done 2026-09-16; see the session above.
- Clerk auth is migrated but only the unauthenticated surface is
  automated — click through sign-in → admin → sign-out once in prod.
- Carry-overs below (Turso token revocation, Blob/Upstash vars, Clerk
  production keys) still stand.

---

## 2026-09-12 → 13 — Production deploy, Vercel git-link repair, dev/prod DB split, CI repair + smoke tests

Handoff for the next session. All work below is complete and verified
(typecheck ✅ · lint ✅ · 89/89 tests ✅ · CI green incl. smoke job ·
production live on Turso).

### Completed

1. **Production is live and verified** — https://sacredspace.vercel.app on
   Turso (`sacredspace-jawaleketan`, aws-ap-south-1). Homepage 200 with seed
   content, deity page 200, search 307→200 (FTS5 ranking live),
   `/api/health` reports healthy+connected, all 5 security headers present
   (CSP, HSTS, nosniff, DENY, referrer-policy).
2. **Vercel Git integration repaired** (root cause of the day's 404s):
   the project had a detached legacy `sourceless` git link pinned to
   `productionBranch: master` — pushes to main built as previews with an
   empty root directory (6s builds serving 404s). Deleted and recreated
   via API: type=github, productionBranch=main, rootDirectory=sacredspace.
   Push-to-main now deploys production automatically (8+ consecutive clean
   deploys). CLI `vercel --prod` remains blocked by the OAuth-login token
   (403 on deployment create) — push-to-deploy is the workflow.
3. **Turso credentials installed** — caught that `echo | vercel env add`
   appends a trailing newline (runtime `Invalid URL` 500s); re-added via
   REST API with clean values. Token rotated once already.
4. **Two-database split** — local dev points at a throwaway dev database
   via `.env.local`; production creds live only in Vercel. Local admin
   edits can no longer touch live data; dev DB auto-seeds on first run.
5. **WAL pragma gated to `file:` URLs** — remote Turso rejects PRAGMA over
   HTTP (`SQL_PARSE_ERROR` noise on every startup); now file-DB only.
6. **CI repaired — was red on every branch**: nitro's alpha unstorage
   declares optional peer `lru-cache@^11.2.6`; npm 12 deduped it invalidly
   to 5.1.1, producing a lockfile CI's npm rejects at `npm ci`. Fixed by
   adding `lru-cache@11.5.2` as a root devDependency (0 invalid entries).
7. **Post-deploy production smoke tests** — new `smoke-production` CI job
   on main pushes: waits for the Vercel deploy, asserts homepage 200 +
   hero content (catches DB breakage), search redirect resolves, health
   reports healthy. Verified green on first run.
8. **Clerk deprecated props removed** — dropped `afterSignInUrl`/
   `afterSignUpUrl` (fallback-redirect props already in place).
9. **Dependabot triage (9 PRs)** — #1 (actions v5) merged; #8 (TS 7)
   closed (fails CI; batch with other majors later); #2 (22 minor/patch)
   rebase re-nudged — merge when green; #3–#7/#9 (vitest 5, jest-dom 7,
   eslint 10 ×2, clerk 1.x, @eslint/js 10) deliberately left for one
   coordinated toolchain-majors session.
10. **SETUP.md** — optional-services table: where each credential comes
    from (Turso/Blob/Upstash) and what degrades without it.

### Action Items (pick up here)

- [ ] **Revoke superseded Turso tokens** (app.turso.tech → Tokens): the
      first token (ending `0P307btb3`) is exposed and unused; the current
      production token (ending `1ZE8Bg`) transited chat — replace via
      `vercel env rm/add TURSO_AUTH_TOKEN production` locally, then revoke.
- [x] Merge Dependabot minor/patch group — superseded by **#11**, merged 2026-09-13.
- [ ] Set `BLOB_READ_WRITE_TOKEN` in Vercel (uploads persist to Blob).
- [ ] Optional: Upstash vars to activate durable rate limiting.
- [x] Toolchain majors batch — done 2026-09-13 (vitest 5, jest-dom 7,
      jsdom 30, eslint 10 +@eslint/js, Clerk 1.5). TypeScript major remains.
- [ ] Before real launch: Clerk is on a **dev instance** (`pk_test_*`) —
      create production keys and raise the strict usage limits.

### Verification Log

```bash
cd sacredspace && npm run typecheck && npm run lint && npm test   # 89/89
gh run list --branch main        # CI green incl. smoke-production
curl -s https://sacredspace.vercel.app/api/health   # healthy
```

---

## 2026-09-12 — docs drift, Blob cleanup, durable rate limiting, FTS5, a11y

Handoff for the next session. All work below is complete and verified
(typecheck ✅ · lint ✅ 0 problems · 86/86 tests ✅).

## Completed This Session

1. **Docs drift fixed** — `sacredspace/SETUP.md` still described the removed
   `/tmp` SQLite fallback, `master` branch, `nodejs24.x`, and `NEXT_PUBLIC_*`
   Clerk vars. All corrected to match the production fail-fast behavior
   (`main`, required Turso, Node 22, `VITE_CLERK_*`, Blob token).
   `.env.example` Turso section rewritten ("required in production").
2. **Blob orphan cleanup** — `deleteStoredFile()` in `src/lib/storage.ts`
   deletes the previous Vercel Blob object when an image/audio is replaced
   or removed; `deleteDeity` also cleans its contents' audio Blobs.
   Blob-only by design (seed images in `public/uploads/` are git-committed
   and must never be deleted); failures logged, never thrown. Wired into
   `updateDeityImage`, `removeDeityImage`, `deleteDeity`,
   `uploadContentAudio`, `removeContentAudio`. 6 new tests.
3. **Durable rate limiting** — `src/lib/rate-limit.ts` rewritten with two
   backends: Upstash Redis REST (no SDK; `UPSTASH_REDIS_REST_URL` +
   `UPSTASH_REDIS_REST_TOKEN`) and the previous in-memory Map as fallback.
   Fail-open: Redis errors/timeouts (>1s) fall back to memory for that
   request. `checkRateLimit`/`enforceRateLimit` are now **async** — all 8
   call sites updated to `await`. 8 new tests. **Action: set the Upstash
   vars in Vercel to activate durable limits.**
4. **FTS5 search** — content search no longer does `LIKE` scans:
   - `contents_fts` virtual table (external-content FTS5 on title,
     description, transliteration, translation) + insert/delete/update
     triggers, created in the DB bootstrap; index rebuilt at startup.
   - `searchContents` runs `MATCH` with BM25 `rank` ordering for multi-term
     queries; type/deity filters and `sortBy=newest` applied in SQL;
     automatic LIKE fallback if FTS is unavailable. Query terms are
     double-quoted + prefix-starred so user input cannot inject FTS syntax.
   - `searchContents` preserves its API shape; route needs no changes.
   - 3 new tests for `buildFtsQuery` (21 existing search tests unchanged).
5. **Sanskrit accessibility** — `lang="sa"` on Devanagari sections: mantra
   reader already had `lang={bodyLang}`; `ProseRenderer` gained a `lang`
   prop; Tiptap admin editor body wrapped in `lang="sa"`.
6. **Dependabot** — `.github/dependabot.yml`: weekly grouped npm updates for
   `sacredspace/` (minor+patch grouped; majors individual) + GitHub Actions.
7. **Hygiene** — `last_31_aug.md` relocated to `docs/analysis-2026-08-31.md`
   and refreshed with this session's completions; `docs/README.md` map and
   `docs/ARCHITECTURE.md` known-gaps updated.

## Action Items (pick up here)

- [x] **Turso setup (was blocking deploy)** — DONE 2026-09-12 late session:
      `sacredspace-jawaleketan` created on Turso (aws-ap-south-1); both vars
      live in Vercel Production. Production verified: homepage 200, deity
      200, search 307→200 (FTS), /api/health reports healthy+database,
      all 5 security headers present.
- [x] **TURSO_AUTH_TOKEN rotated** (2026-09-13): replacement token minted,
      validity-tested against the DB, installed in Vercel Production via API,
      and verified live (homepage/search 200, health healthy). Residual:
      tokens transited chat during setup — revoke the superseded token in
      the Turso dashboard (Tokens page) and prefer minting future tokens
      without pasting them.
- [x] **Vercel Git integration repaired** (2026-09-12): the project's git
      link was a detached legacy `sourceless` link pinned to
      `productionBranch: master` — pushes to main built as previews with
      an empty root directory. Deleted and recreated via API
      (type=github, org/repo re-linked, productionBranch=main, and project
      rootDirectory=sacredspace). Push-to-main now deploys production;
      CLI `vercel --prod` remains blocked by the OAuth token (403
      invalidToken on deployment create) — push-to-deploy is the path.
- [x] **Two-database setup** (2026-09-13): `sacredspace` stays production-only
      (creds in Vercel); local dev now points at a separate throwaway dev
      database via `.env.local` — local admin edits can no longer touch live
      data. Dev DB auto-seeds on first `npm run dev`. Also fixed the
      unconditional `PRAGMA journal_mode=WAL` (remote Turso rejects PRAGMA
      over HTTP) — now gated to `file:` URLs.
      Standing hygiene: revoke superseded Turso tokens in the dashboard.
- [ ] Set `BLOB_READ_WRITE_TOKEN` in Vercel (uploads then persist to Blob).
- [ ] Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel to
      activate durable rate limiting (optional — memory fallback works).
- [x] FTS5 index verified against the real dev server (2026-09-12, later
      same day): searched "gayatri" via the live preview — all 7 matching
      mantras returned, and the dev log shows zero "FTS index rebuild
      failed" entries, so the MATCH path ran clean. Item closed.
- [ ] Remaining backlog: image optimization #14 (responsive `srcset`/WebP —
      lazy loading + width/height already in place), UI-string i18n,
      tests for search route/auth flows/audio player UI.

## Verification Log

```bash
cd sacredspace
npx tsc --noEmit   # clean
npx eslint .       # 0 problems
npx vitest run     # 86/86 pass (11 files)
```

---

# Session Notes — 2026-09-06 (lint, quick wins, production DB fail-fast)

Handoff for the next session. All work below is complete and verified
(typecheck ✅ · lint ✅ 0 problems · 72/72 tests ✅).

## Completed This Session

1. **Five quick wins** (from the improvement audit):
   - `admin.dashboard.tsx` errorComponent now differentiates 401 (sign-in
     prompt) from other errors (500/429 → `RouteErrorFallback` with retry).
   - PWA `runtimeCaching` uses relative `/api/` pattern instead of hardcoded
     `sacredspace.vercel.app` (works on preview URLs + custom domains).
   - `.env.example` fixed: removed invalid `[TEMPLATE]` line; documented all
     vars the app reads (Clerk, Turso, Blob) with fallback notes.
   - Removed `@types/dompurify` (DOMPurify ships own types since v3).
   - Root `README.md` created (stack, repo layout, setup, scripts, deploy).
2. **ESLint 9 wired into CI** — flat config `sacredspace/eslint.config.js`
   (typescript-eslint + react-hooks v7 incl. React-compiler rules +
   react-refresh). `@eslint/js` pinned to `^9` (v10 range conflicts with
   ESLint 9 peers). CI now runs typecheck → lint → tests. Real bugs caught
   & fixed: `react-hooks/immutability` self-referencing rAF loop in
   AudioProvider; 4× `set-state-in-effect` (theme, search URL sync, saved,
   mantra/admin editor — replaced with `useSyncExternalStore`, lazy init,
   adjust-during-render, derived state); 2 stale-closure `exhaustive-deps`
   in `mantra.$slug.tsx`; 3 `no-explicit-any`; unused imports; `useBlob`→
   `shouldUseBlob` rename (false-positive hook name). `routeTree.gen.ts`
   ignored; test files exempt from `no-console`/`no-explicit-any`.
3. **Production DB fail-fast** — `src/server/db/index.ts` now throws at
   module load in production (`NODE_ENV=production` or `VERCEL`) without
   `TURSO_DATABASE_URL` instead of silently using ephemeral `/tmp` SQLite.
   Also throws when a remote `libsql://` URL lacks `TURSO_AUTH_TOKEN`.
   Local dev unchanged (file fallback + warn). `SETUP.md` updated: Turso is
   now *required* for production.
4. **Turso chosen for production DB** (Gravity Index search) — matches the
   existing Drizzle + `@libsql/client` stack. Setup link found, **credentials
   not yet obtained** — see action item below.

## Action Items (pick up here)

- [ ] **Turso setup (blocking next deploy)** — open the Gravity setup link
      (tracked; re-run Gravity search if expired) or `turso db create
      sacredspace`, then set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in
      Vercel env vars **before the next deploy** (deploy will otherwise
      fail fast by design).
- [ ] Set `BLOB_READ_WRITE_TOKEN` in Vercel (still open from last session).
- [x] Optional (done 2026-09-12): distributed rate limiting
      (Upstash-backed, in-memory fallback); image optimization (#14) still
      open; `last_31_aug.md` moved to `docs/analysis-2026-08-31.md`.

## Verification Log

```bash
cd sacredspace
npx tsc --noEmit   # clean
npx eslint .       # 0 problems
npx vitest run     # 72/72 pass
```

Note: local machine runs Node v24 but project pins `^22` with
`engine-strict=true` — use `npm install --engine-strict=false` or `nvm use`.

---

# Session Notes — 2026-09-05 (workspace cleanup + SacredSpace improvements)

Handoff for the next session. All work below is complete and verified
(typecheck ✅ · 72/72 tests ✅ · production build ✅).

## Completed This Session

1. **Root package.json removed** — root was a phantom Node project (`satori`,
   `@resvg/resvg-js` — both unused/transitive). Deleted `package.json`,
   `package-lock.json`, root `node_modules/`. All package management now lives
   in `sacredspace/`.
2. **Skills consolidated** — `skills/`, `marketingskills/`, `agent-skills/`
   merged into a single `skills/` with 74 skills (no name collisions),
   updated `.claude-plugin/marketplace.json` (marketplace `unified-agent-skills`,
   5 plugins) and `README.md` with attribution table.
3. **`_bmad-output/` retired** — artifacts moved to
   `docs/planning|implementation|brainstorming`. BMAD durably repointed via
   `_bmad/custom/config.toml` overrides (`output_folder = "docs"`).
4. **Docs populated** — `docs/README.md` (workspace overview),
   `docs/ARCHITECTURE.md` (stack, data model, patterns, deployment, gaps),
   `docs/SETUP.md` (quick start linking `sacredspace/SETUP.md`).
5. **9 SacredSpace fixes shipped** (details in `ARCHITECTURE.md §8`):
   Vercel Blob storage abstraction (`src/lib/storage.ts`), slug-conflict 409s
   (`ConflictError`), published-only Mantra of the Day, ESM-safe
   `getClientIp()`, admin pagination (50/page + UI controls), `useTheme()`
   hook, `updateDeity` timestamps, `likes.ts` static imports, prominent
   in-memory rate-limit documentation.
6. **New dependency** — `@vercel/blob` added to `sacredspace/package.json`.

## Suggested Next Steps (pick up here)

- [ ] Set `BLOB_READ_WRITE_TOKEN` in Vercel project settings (connect a Blob
      store) so production uploads persist.
- [ ] Decide on Turso for persistent production DB (see `docs/SETUP.md §4`).
- [ ] Commit everything — the whole workspace is currently untracked in git
      (`git status` shows all folders as `??`). Consider an initial commit +
      a root `.gitignore` (`node_modules/`, `.env.local`, `data/`, `dist/`).
- [ ] Remaining improvement ideas (tracked in `docs/ARCHITECTURE.md §8`):
      distributed rate limiting (Upstash/Vercel KV), delete replaced Blob
      objects, FTS5 search if the library grows.
- [x] `last_31_aug.md` — filed as `docs/analysis-2026-08-31.md` (2026-09-12).

## Quick Resume

```bash
cd sacredspace
npm run dev        # http://localhost:3000
npm test           # 72 tests
npm run typecheck
```

Key docs: `docs/README.md` · `docs/ARCHITECTURE.md` · `docs/SETUP.md` ·
`docs/implementation/deferred-work.md`