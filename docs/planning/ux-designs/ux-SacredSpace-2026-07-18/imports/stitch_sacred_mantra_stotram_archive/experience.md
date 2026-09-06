---
name: SacredSpace
status: final
sources:
  - {planning_artifacts}/prds/prd-SacredSpace-2026-07-18/prd.md
updated: 2026-07-18
---

# SacredSpace — Experience Spine

## Foundation

Responsive web (desktop + mobile). No UI system named — custom components per `DESIGN.md`. Dark mode toggles via settings or system preference. Anonymous usage — no accounts required for visitors.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | Site root `/` | God cards grid, featured content |
| God Detail | Home card tap `/deity/{slug}` | List of mantras/stotras for that deity |
| Mantra Detail | God detail card tap `/mantra/{slug}` | Full text, metadata, heart/share/save |
| Search | Header search bar | Search across titles, deities, tags |
| Saved | Nav link `/saved` | Anonymous localStorage collection |
| Admin Login | `/admin` | Clerk auth gate |
| Admin Dashboard | `/admin/dashboard` | Content list, status, manage |
| Admin Editor | `/admin/edit/{id}` or `/admin/create` | Tiptap editor for mantra/stotra content |

Primary nav: top header with logo + search + saved link (desktop). Bottom tab bar with Home, Browse, Saved (mobile).
Admin nav: sidebar with Posts, Categories, Settings (desktop); top bar tabs (mobile).

## Voice and Tone

| Do | Don't |
|---|---|
| "Ganesha Stotra" | "Check out this cool stotra!" |
| "Saved to collection" | "✓ Added to bookmarks!" |
| Sanskrit text in Devanagari | Transliteration as primary text |
| Minimal, respectful UI copy | Playful or gamified language |

## Component Patterns

| Component | Use | Behavioral rules |
|---|---|---|
| God Card | Home grid | Tap → `/deity/{slug}`. Hover: gentle shadow lift. Image/icon placeholder + deity name. |
| Mantra Card | God detail list | Tap → `/mantra/{slug}`. Shows title, deity tag, short preview. |
| Heart Button | Mantra detail | Toggle heart. Gold fill when active. No animation. |
| Share Button | Mantra detail | Opens native share sheet (Web Share API) with mantra URL. |
| Save Button | Mantra detail | Toggle save to localStorage. "Saved" indicator on active. |
| Search Bar | Header (desktop), top (mobile) | Debounced input (300ms). Results dropdown for instant matches. |
| Saved Page | `/saved` | Lists all locally saved mantras/stotras. Empty state if none. |
| Admin Editor | Dashboard | Tiptap with Devanagari font support, heading levels, bold, italic. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Empty home | Home | "Browse by deity below" with category grid |
| Empty god detail | God Detail | "No mantras yet" — admin-facing only |
| Empty saved | Saved | "No saved mantras — browse and tap the heart to save" with link to Home |
| Search empty | Search dropdown | "No results found" — no suggestions |
| Offline | All visitor | Static content works, saves persist locally. No banner needed. |
| Loading | Any | Skeleton cards matching card shape |
| Admin — no posts | Dashboard | "Create your first mantra" CTA |

## Interaction Primitives

- Tap to navigate. Long-press reserved for browser defaults.
- Share uses native Web Share API (falls back to copy-link).
- Search debounces at 300ms.
- Back button/gesture returns to previous surface.
- **Banned:** autoplay, carousels, push notification prompts, interstitial modals.

## Accessibility Floor

- Every interactive element has an accessible label (heart button: "Like this mantra", "Unlike this mantra").
- Tap targets ≥ 44px.
- Keyboard navigable: Tab through deity cards, mantra cards, actions.
- Focus outline visible on all interactive elements.
- Devanagari text at minimum 20px for readability (see `DESIGN.md.typography.sanskrit`).
- Dark mode respects `prefers-color-scheme` with manual toggle override.

## Key Flows

### Flow 1 — Priya finds and reads a stotra (targeted seeker)

1. Priya arrives at SacredSpace searching for a specific Ganesha Stotra.
2. She types "Ganesha" in the search bar and sees results dropdown.
3. She taps the Ganesha Stotra result → `/mantra/ganesha-stotra`.
4. **Climax:** The stotra renders in large Devanagari with romanized transliteration below, line by line. She scrolls through the full text.
5. She taps the heart icon → turns gold ("Liked").
6. She taps Share → native share sheet opens.
7. She taps Save → icon fills, "Saved to collection" appears briefly.
8. She browses more stotras under Ganesha via the deity link.

Failure: search returns no results → "No results found" with suggestion to browse by deity.

### Flow 2 — Admin publishes new content

1. Admin navigates to `/admin`, logs in via Clerk (Google/GitHub OAuth).
2. Dashboard loads showing all published and draft posts.
3. Admin clicks "New Mantra" → `/admin/create`.
4. Tiptap editor opens with title field, deity selector, and rich text body.
5. Admin pastes Sanskrit text from book into editor — Devanagari renders correctly.
6. Assigns deity category (e.g., "Ganesha"), adds tags, sets slug.
7. Clicks Publish → post goes live at `/mantra/{slug}`.
8. **Climax:** Green "Published" badge appears on the post in the dashboard list.

### Flow 3 — New visitor discovers content

1. Visitor lands on homepage.
2. Sees a grid of God cards with deity names and icons.
3. Clicks "Shiva" card → `/deity/shiva`.
4. Sees a list of mantra/stotra cards for Shiva.
5. Taps "Shiva Panchakshara Stotra" → full text page.
6. **Climax:** Reads the stotra, hearts it, and saves — no account needed, no friction.
