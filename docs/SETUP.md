# Setup — Quick Start

The canonical, detailed setup guide lives in **[`sacredspace/SETUP.md`](../sacredspace/SETUP.md)** — environment variables, database options (local SQLite vs Turso), Vercel deployment, troubleshooting table, and architecture decision rationale.

This page is the short path to a running dev environment.

---

## Prerequisites

- **Node.js 22+** (`.nvmrc` provided; `engines` enforces `>= 22`)
- npm

---

## 1. Install & Configure

```bash
cd sacredspace
npm install
```

Create `sacredspace/.env.local` (values from the [Clerk dashboard](https://dashboard.clerk.com) → your app → API Keys):

```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

Optional — file uploads in production go to **Vercel Blob** when these are set (otherwise uploads fall back to the local filesystem in dev):

```ini
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

> The server validates these at startup in development and throws immediately if missing (`src/lib/env.ts`).

## 2. Run

```bash
npm run dev        # http://localhost:3000
```

The SQLite database (`data/sacredspace.db`) is **auto-created and auto-seeded** (8 deities, 17 mantras/stotras) on first run — no manual seed required. To force a clean reseed:

```bash
npm run db:seed
```

## 3. Verify

| Check | Expectation |
|-------|-------------|
| `http://localhost:3000` | Homepage renders deity grid + Mantra of the Day |
| `npm run typecheck` | Passes with no errors |
| `npm test` | Vitest suite passes (server functions + components) |
| `npm run db:studio` | Drizzle Studio opens with the 3 tables |

## 4. (Optional) Persistent Production DB

Local dev uses a file DB. On Vercel, the DB lives in ephemeral `/tmp/` and reseeds on every cold start. For durable likes/admin writes, connect [Turso](https://turso.tech):

```bash
turso db create sacredspace
turso db show sacredspace --url          # → TURSO_DATABASE_URL
turso db tokens create sacredspace       # → TURSO_AUTH_TOKEN
```

Add both to `.env.local` (and to Vercel project settings). See [sacredspace/SETUP.md §3](../sacredspace/SETUP.md#3-database) for the full walkthrough.

---

## Command Reference

Run from `sacredspace/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build (Nitro/Vercel output) |
| `npm run test` | Run Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Re-seed local DB |
| `npm run db:push` | Push Drizzle schema |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:studio` | Drizzle Studio GUI |

## Troubleshooting

See the [troubleshooting table in the full guide](../sacredspace/SETUP.md#10-troubleshooting) — covers the Clerk env var pitfalls, the `Server function info not found` registration bug, and DB-reset-on-cold-start behavior.