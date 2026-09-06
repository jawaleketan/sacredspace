# SacredSpace

A progressive web app for exploring Sanskrit mantras and stotras — read, listen, and connect with ancient Vedic chants.

**Live:** [sacredspace.vercel.app](https://sacredspace.vercel.app)

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) + Tailwind CSS v4
- [Clerk](https://clerk.com) for auth (public site + admin panel)
- Drizzle ORM + SQLite (libSQL) — local file in dev, [Turso](https://turso.tech) in production
- Tiptap rich-text editor for content authoring
- PWA (offline support, service worker) · Satori OG images · dark mode

## Repository layout

```
sacredspace/     The application (all source, config, tests)
docs/            PRD, architecture, planning docs, session notes
skills/, _bmad/  BMAD workflow & skills scaffolding
```

## Getting started

```bash
cd sacredspace
npm ci
cp .env.example .env.local   # then fill in the Clerk keys
npm run dev                  # http://localhost:3000
```

The SQLite database is created, migrated, and seeded automatically at startup. Full setup instructions: [`sacredspace/SETUP.md`](sacredspace/SETUP.md).

## Scripts (run inside `sacredspace/`)

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check |
| `npm test` / `npm run test:watch` | Vitest test suite |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## Deployment

Vercel (`nitro` vercel preset). Required production env vars are documented in
[`sacredspace/.env.example`](sacredspace/.env.example): Clerk keys (required), plus
`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` for the database and `BLOB_READ_WRITE_TOKEN`
for file uploads (both optional — but without Turso, production data is ephemeral).
