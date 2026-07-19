# SacredSpace — Project Setup & Workflow

## Overview

SacredSpace is a TanStack Start (React) directory of Hindu mantras and stotras with Clerk admin auth, Tiptap editor, and an elegant reader frontend. Deployed on Vercel.

**Stack:** TanStack Start v1.168 + Router (file-based, `createFileRoute`) + Query + Clerk + Tiptap + Drizzle ORM + SQLite (`@libsql/client`) + Tailwind CSS v4 + Nitro v3 (Vercel preset)

**Repo:** https://github.com/jawaleketan/sacredspace

---

## 1. First-Time Clone & Install

```bash
git clone https://github.com/jawaleketan/sacredspace.git
cd sacredspace
npm install
```

---

## 2. Environment Variables

Create `.env.local` in the project root:

```ini
# Clerk (required for auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URL config (optional defaults)
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Turso (optional — only for production remote DB)
# TURSO_DATABASE_URL=libsql://sacredspace-xxx.turso.io
# TURSO_AUTH_TOKEN=xxx
```

**How to get Clerk keys:**
1. Go to https://dashboard.clerk.com
2. Create an application
3. Copy the Publishable Key and Secret Key from the API Keys page

---

## 3. Database

### Local Dev (default — SQLite file)

The app uses a local SQLite file at `data/sacredspace.db`. The schema is auto-created and data is auto-seeded at first request.

```bash
# Seed the database (8 deities + 17 mantras/stotras)
npm run db:seed
```

### Production with Turso (optional — for persistent remote DB)

If you want writes (likes, admin edits) to persist on Vercel, set up Turso:

```bash
# Install Turso CLI
npm install -g turso

# Login and create database
turso auth login
turso db create sacredspace

# Get connection details
turso db show sacredspace --url
turso db tokens create sacredspace

# Push schema and seed
TURSO_DATABASE_URL=libsql://xxx TURSO_AUTH_TOKEN=xxx npm run db:push
TURSO_DATABASE_URL=libsql://xxx TURSO_AUTH_TOKEN=xxx npx tsx scripts/seed.ts

# Add these env vars to Vercel project settings
```

**Without Turso:** On Vercel, the DB is created in `/tmp/sacredspace.db` and auto-seeded at cold start. Data resets on cold starts (acceptable for demo — content is the same every time).

---

## 4. Running Locally

```bash
# Dev server (default http://localhost:3000)
npx vite dev --host --port 3000

# Or
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Build for production (Vercel output) |
| `npm run db:seed` | Seed local DB with deities + content |
| `npm run db:push` | Push Drizzle schema to DB |
| `npm run db:generate` | Generate Drizzle migration SQL |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |

---

## 5. Project Structure

```
sacredspace/
├── src/
│   ├── components/          # React components
│   │   ├── DeityCard.tsx    # Deity card with image
│   │   ├── ProseRenderer.tsx # Tiptap HTML → styled prose
│   │   └── TipTapEditor.tsx # Rich text editor
│   ├── routes/              # File-based routes
│   │   ├── index.tsx        # Homepage (deity cards)
│   │   ├── deity.$slug.tsx  # Deity detail + content list
│   │   ├── mantra.$slug.tsx # Content reader with view modes
│   │   ├── search.tsx       # Search page with filters
│   │   ├── saved.tsx        # Saved collection (localStorage)
│   │   ├── sign-in.tsx      # Clerk sign-in
│   │   ├── sign-up.tsx      # Clerk sign-up
│   │   └── admin/           # Admin routes (auth-protected)
│   │       ├── index.tsx        # Admin landing → sign-in
│   │       ├── dashboard.tsx    # Content CRUD table
│   │       ├── analytics.tsx    # Likes analytics
│   │       ├── deities.tsx      # Deity CRUD with images
│   │       └── editor.$slug.tsx # Tiptap content editor
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts     # DB connection + auto-migrate + auto-seed
│   │   │   ├── schema.ts    # Drizzle schema (deities, contents, likes)
│   │   │   └── seed-data.ts # Embedded seed data (shared)
│   │   └── functions/       # Server functions (TanStack Start)
│   │       ├── admin.ts     # Admin CRUD server fns
│   │       ├── analytics.ts # Analytics queries
│   │       ├── contents.ts  # Content queries + search
│   │       ├── deities.ts   # Deity CRUD + image upload
│   │       ├── likes.ts     # Like toggle + status
│   │       └── saved.ts     # Saved contents fetch
│   └── styles/
│       └── app.css          # Tailwind v4 + typography plugin
├── scripts/
│   └── seed.ts              # Standalone seed script (imports seed-data)
├── drizzle/                 # Drizzle migrations
├── nitro.config.ts          # Nitro/Vercel config
├── vercel.json              # Vercel framework config
├── vite.config.ts           # Vite + TanStack Start + Nitro + Tailwind
└── package.json
```

---

## 6. How the DB Works on Vercel

```
Cold start → createClient("file:/tmp/sacredspace.db")
           → runSeed() creates tables + seeds 8 deities + 17 contents
           → first request serves data from /tmp/
           → subsequent warm requests: DB already has data
           → cold start: resets /tmp/ (seeded again)
```

If `TURSO_DATABASE_URL` is set, the app connects to a remote Turso database instead (persistent across cold starts).

---

## 7. Deploy to Vercel

### Automatic (GitHub — recommended)

1. Push to `master` on GitHub
2. Go to https://vercel.com → Add New Project
3. Import `jawaleketan/sacredspace`
4. Framework is auto-detected as "TanStack Start"
5. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
   - `CLERK_SECRET_KEY` — Clerk secret key
6. Deploy
7. Every `git push` triggers automatic redeploy

### Manual (CLI)

```bash
# Build for Vercel
npm run build

# Deploy using Vercel CLI
npx vercel --prod
```

### Vercel Build Notes

- Build command: `npm run build` (runs `vite build` — Nitro handles the rest)
- Output directory: `.vercel/output` (Nitro Build Output API v3)
- Node.js runtime: `nodejs24.x` (auto-detected by Nitro)
- No `npm run db:seed` during build — DB is auto-seeded at runtime on Vercel

---

## 8. Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `@libsql/client` over `better-sqlite3` | Prebuilt Linux binaries; works on Vercel Lambda |
| `/tmp/sacredspace.db` on Vercel | Only writable path on Lambda; auto-seeded at cold start |
| `ensureSeeded()` guard | Lazy init pattern — seeds once, cached promise |
| Inline server fns in routes | Avoids "Server function info not found" hash registration bug |
| Clerk auth in server fns | `auth()` from `@clerk/tanstack-react-start/server` |
| `localStorage` for saves | Anonymous users — no user accounts |
| Session cookies for likes | Track likes per anonymous session in DB |
| Base64 image uploads | Simple file storage in `public/uploads/` (git-committed) |
| Tailwind typography plugin | `@tailwindcss/typography` via `@plugin` in CSS |

---

## 9. First Session Checklist

```bash
git clone https://github.com/jawaleketan/sacredspace.git
cd sacredspace
npm install

# Create .env.local with Clerk keys
# (paste from Clerk dashboard)

npx vite dev --host --port 3000
# Open http://localhost:3000

# If you need a clean DB:
npm run db:seed
```

---

## 10. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Server function info not found` | Move inline server fn out of the route, or inline the logic |
| `undefined cannot be passed as argument` | Add `await` before `.get() / .all() / .run()` |
| `ENOENT: mkdir '/var/task/data'` | Switch to `@libsql/client` with `/tmp/` path |
| Clerk auth fails on Vercel | Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` env vars |
| Images not loading | Images in `public/uploads/` are committed to git — push them |
| DB resets on cold start | Set up Turso remote DB (see section 3) |
