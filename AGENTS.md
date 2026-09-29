# SacredSpace

## Stack

- **Language / Runtime**: TypeScript, Node 22+
- **Framework**: TanStack Start v1.168 (React 19, SSR + server functions), Nitro on Vercel
- **Key dependencies**: Tailwind CSS v4, Drizzle ORM + libSQL (Turso in prod), Clerk, TipTap v3
- **Package manager**: npm

## Build approach

Tracer Bullet (each feature ships end to end through every layer, working when it lands).

## Workflow

Beta (after /develop: /check verify, then /test; GA features add /check review + /document).

## Commands

```bash
# All commands run inside sacredspace/
npm ci                 # Install
npm run dev            # Dev server (http://localhost:3000)
npm run build          # Build
npm run typecheck      # TypeScript strict check
npm test               # Unit tests (Vitest)
npx playwright test    # e2e tests
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- All app code lives in `sacredspace/`; all commands run from that directory.
- Server inputs validated with Zod via `.validator()`; errors use typed `AppError` classes in `src/lib/errors.ts` (401/404/409/429), never parsed messages.
- Admin writes are Clerk-gated (auth + role) and rate-limited; public reads rate-limited (120 req/min/IP). Rate-limit calls are async; await them.
- User HTML is sanitized server-side (`sanitize-html`) and client-side (DOMPurify).
- Secrets come from the environment (`sacredspace/.env.local`); never commit them.
- Schema changes: Drizzle `db:generate` + `db:push`, plus an incremental migration in `src/server/db/index.ts` so prod cold starts self-heal.
- Loaders fetch data; every screen ships empty, loading, and error states.
- Delete replaced code; Conventional Commits.

## Agent skills

- [scope](.claude/skills/scope/): `jsmastery-pro/skills`, plans what to build in `docs/scope/`
- [audit](.claude/skills/audit/): `jsmastery-pro/skills`, maintains these AGENTS.md files
- [architect](.claude/skills/architect/): `jsmastery-pro/skills`, writes build specs in `docs/specs/`
- [develop](.claude/skills/develop/): `jsmastery-pro/skills`, builds features from specs
- [check](.claude/skills/check/): `jsmastery-pro/skills`, verifies on the real app / fresh-model code review
- [test](.claude/skills/test/): `jsmastery-pro/skills`, writes Vitest/Playwright suites for the change
- [document](.claude/skills/document/): `jsmastery-pro/skills`, writes PR bodies, changelogs, release notes
- [sync](.claude/skills/sync/): `jsmastery-pro/skills`, keeps AGENTS.md, scope, and spec statuses current
- [debug](.claude/skills/debug/): `jsmastery-pro/skills`, root-cause bug fixes with regression tests

Declined: stack skill discovery (recorded 2026-09-29; the repo already carries 134 skills, revisit anytime)
MCP servers: none connected

## Context files

- [sacredspace/AGENTS.md](sacredspace/AGENTS.md): the app itself (routes, server functions, DB, admin panel, testing)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
