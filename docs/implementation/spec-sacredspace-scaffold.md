---
title: SacredSpace Project Scaffold
type: feature
created: 2026-07-18
baseline_commit: NO_VCS
status: in-progress
review_loop_iteration: 0
---

## Intent

**Problem:** No project exists yet. The full SacredSpace application needs a TanStack Start foundation with database schema, auth, and directory structure before any features can be built.

**Approach:** Initialize a TanStack Start project, configure Drizzle ORM with SQLite, create the database schema (deities, contents, likes), set up Clerk authentication, and establish the route structure.

## Boundaries & Constraints

**Always:**
- Use TanStack Start (React) with TypeScript
- Use Drizzle ORM with better-sqlite3 (SQLite)
- Use Clerk for admin-only authentication
- Use TanStack Router file-based routing
- All routes prefixed: `/deity/*`, `/mantra/*`, `/admin/*`
- Status: `draft` or `published` on contents

**Ask First:**
- Clerk API keys and environment variable values
- Any additional npm packages beyond the pinned stack

**Never:**
- No user authentication for visitors
- No REST API — use TanStack Start server functions
- No external database service (SQLite only)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Init project | `npm create @tanstack/start` | Project compiles and dev server runs | Follow CLI prompts |
| DB migration | `drizzle-kit push` | Tables created in SQLite file | Log drizzle errors |
| Clerk setup | Clerk keys in env | Admin route redirects unauthenticated | Show login page |
| Route access | Visit `/admin` without auth | Redirect to Clerk login | N/A |

## Code Map

- `app/routes/` -- TanStack Router file-based routes
- `app/server/db/schema.ts` -- Drizzle schema (deities, contents, likes)
- `app/server/db/index.ts` -- SQLite client connection
- `app/server/functions/` -- TanStack Start server functions
- `app/features/` -- Feature-based component directories

## Tasks & Acceptance

**Execution:**
- [ ] `sacredspace/` -- Initialize TanStack Start project via `npm create @tanstack/start` with TypeScript
- [ ] `sacredspace/` -- Install dependencies: drizzle-orm, better-sqlite3, drizzle-kit, @clerk/tanstack-react-start, @tanstack/react-query
- [ ] `app/server/db/schema.ts` -- Define Drizzle schema: deities (id, name, slug, image_url), contents (id, deity_id, type, title, slug, sanskrit_text, transliteration, translation, tags_json, status, created_at, updated_at), likes (id, content_id, session_id, created_at)
- [ ] `app/server/db/index.ts` -- Initialize better-sqlite3 client and drizzle instance
- [ ] `app/server/functions/` -- Create placeholder server functions: getDeities, getContentsByDeity, getContent, toggleLike
- [ ] `sacredspace/` -- Set up Clerk provider with `<ClerkProvider>` wrapping admin routes
- [ ] `app/routes/` -- Create route files: `index.tsx`, `_visitor/deity.$slug.tsx`, `_visitor/mantra.$slug.tsx`, `_admin/admin/index.tsx`, `_admin/admin/dashboard.tsx`
- [ ] `app/features/` -- Create directory structure: visitor/home, visitor/deities, visitor/mantras, admin/dashboard, admin/editor

**Acceptance Criteria:**
- Given a fresh clone, when `npm install && npm run dev` runs, then the dev server starts without errors
- Given the project root, when `drizzle-kit push` runs, then SQLite tables are created at the configured path
- Given a visit to `/admin` without auth, when the page loads, then Clerk login form appears
- Given the directory tree, when inspected, then it matches the architecture spine structure

## Verification

**Commands:**
- `npm run dev` -- expected: dev server starts on localhost:3000
- `npx drizzle-kit push` -- expected: tables created in SQLite file
- `npm run build` -- expected: production build succeeds
