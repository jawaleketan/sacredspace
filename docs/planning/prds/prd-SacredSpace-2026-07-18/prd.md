---
title: SacredSpace — Mantra & Stotra Directory
status: final
created: 2026-07-18
updated: 2026-07-18
---

## Vision

SacredSpace is a clean, modern directory of mantras and stotras for spiritual seekers. Visitors browse by deity, read sacred texts with translations, and save favorites — no account required. The admin (only) publishes and manicures content through a private dashboard.

## User Journeys

**UJ-1 — Targeted seeker (Priya)**
1. Lands on SacredSpace searching for a specific mantra/stotra (e.g., Ganesha Stotra)
2. Searches or browses by God name
3. Finds the stotra page with full text
4. Reads the text (Sanskrit + translation/meaning)
5. Hearts (likes) the page — anonymous
6. Shares via link or social
7. Saves to personal collection — anonymous (localStorage)
8. Continues browsing more deities

**UJ-2 — Admin**
1. Logs in via Clerk (admin-only auth)
2. Lands on dashboard
3. Creates new mantra/stotra post in Tiptap editor
4. Assigns God category, tags, titling
5. Edits/manages existing posts
6. Publishes, unpublishes, or deletes
7. Exits dashboard

**UJ-3 — New visitor (browser)**
1. Lands on homepage
2. Sees a grid of God cards
3. Clicks a God card
4. Sees list of mantras/stotras for that God
5. Selects one
6. Reads, hearts, shares — same as UJ-1

## Features

### Visitor-facing
- **Homepage** — God cards grid
- **God detail page** — mantra/stotra cards filtered by deity
- **Mantra/Stotra detail page** — full text with Tiptap rendering, heart, share, save
- **Search** — search by God name or mantra/stotra name
- **Anonymous save** — bookmark collection via localStorage, no account needed

### Admin Dashboard
- **Clerk auth** — admin-only login
- **Content editor** — Tiptap-based CRUD for mantras/stotras (title, deity, text, tags)
- **Content management** — list, edit, publish/unpublish, delete posts
- **Category management** — create/manage deity categories

## Functional Requirements

**FR-1** Homepage displays a responsive grid of deity cards (image + name).
**FR-2** Clicking a deity card navigates to `/deity/{slug}` with filtered mantra/stotra list.
**FR-3** Each mantra/stotra page at `/mantra/{slug}` renders full text via Tiptap.
**FR-4** Each mantra/stotra page shows heart (like), share, and save buttons.
**FR-5** Anonymous saves persist in browser localStorage under "saved" collection.
**FR-6** Search bar searches across title, deity name, and tags.
**FR-7** Admin login at `/admin` via Clerk with single-admin mode.
**FR-8** Admin dashboard at `/admin/dashboard` lists all posts with status.
**FR-9** Admin editor uses Tiptap with Sanskrit/Devanagari support.
**FR-10** Admin can assign deity category, title, slug, and tags per post.
**FR-11** Admin can publish, unpublish, or delete posts.
**FR-12** Admin can add/edit deity categories.

## Non-Functional Requirements

**NFR-1** Text rendering must support Devanagari (Sanskrit) script properly.
**NFR-2** Pages must be SEO-optimized for mantra/stotra search queries.
**NFR-3** Site must be fully responsive (mobile-first).
**NFR-4** Page load time < 2s on standard connections (static rendering preferred).
**NFR-5** No user data collected beyond anonymous localStorage saves.

## Open Questions

- Source/attribution for text content from book — display credit?
- Multi-language support beyond Sanskrit + English?
- Analytics to track popular mantras/stotras?
