# Session Notes — 2026-09-12 (docs drift, Blob cleanup, durable rate limiting, FTS5, a11y)

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