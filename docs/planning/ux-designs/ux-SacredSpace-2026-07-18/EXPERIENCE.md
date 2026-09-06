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
| Home | Site root `/` | God cards grid, featured content, hero quote |
| Onboarding | First visit | 4-step intro (welcome, discover deities, collective resonance, immersive practice) |
| Deity Directory | Nav `/deities` or Home card tap | Browse by deity archetype |
| God Detail | Deity card tap `/deity/{slug}` | List of mantras/stotras for that deity |
| Mantra Detail | God detail card tap `/mantra/{slug}` | Full text, metadata, heart/share/save |
| Mantra Reader (Enhanced) | Mantra detail toggle | Sanskrit scaling, word analysis, audio player, transliteration toggle |
| Search | Header search bar | Search across titles, deities, tags — with filter chips |
| Saved | Nav link `/saved` | Anonymous localStorage collection |
| Rituals & Guides | Nav `/rituals` | Sacred practice guides, puja rituals |
| Admin Login | `/admin` | Clerk auth gate |
| Admin Dashboard | `/admin/dashboard` | Content list, stats cards, publish status |
| Admin Editor | `/admin/edit/{id}` or `/admin/create` | Tiptap editor for mantra/stotra content |
| Admin Categories | `/admin/categories` | Create/manage deity categories |
| Admin Analytics | `/admin/analytics` | Likes, engagement trends, device type breakdown |
| Admin Settings | `/admin/settings` | Profile, account |

Primary nav: top header with logo + search + saved link (desktop). Bottom tab bar with Home, Browse, Saved (mobile).
Admin nav: sidebar with Dashboard, Directory, Analytics, Users, Settings (desktop); top bar tabs (mobile).

Composition reference: `mockups/home.html`, `mockups/mantra-reader.html`, `mockups/search.html`, `mockups/deity-detail.html`, `mockups/admin-dashboard.html`, `mockups/admin-editor.html`, `mockups/admin-analytics.html`. Spine wins on conflict.

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
| God Card | Home + Deity Directory | Tap → `/deity/{slug}`. Hover: gold top accent bar lift with `transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1)`. |
| Mantra Card | God detail list | Tap → `/mantra/{slug}`. Shows title, deity tag chip, Sanskrit preview, type chip. Hover: gold border. |
| Heart Button | Mantra detail, cards | Toggle heart. Gold fill when active. Ping animation on first tap. Floating FAB on desktop reader. |
| Share Button | Mantra detail | Opens native share sheet (Web Share API) with mantra URL. Fallback: copy link. |
| Save Button | Mantra detail | Toggle save to localStorage. "Saved" indicator on active. |
| Filter Chips | Search, Directory | Rounded-full pills. Active: gold border + gold/10 bg. Categories: All, Ganesha, Shiva, Vishnu, Durga, etc. |
| Search Bar | Header (desktop), top (mobile) | Debounced input (300ms). Results dropdown with quick previews. Gold border on focus. |
| Saved Page | `/saved` | Lists all locally saved mantras/stotras. Empty state with link to Home. |
| Sanskrit Text | Mantra detail | 20px Noto Sans Devanagari, line-height 2.0. Paired with italic transliteration and gold-bordered translation. |
| Reading Controls | Enhanced reader | Font size slider (60%-180%). View toggle: Original / Transliteration. Word analysis grid. |
| Audio Player | Enhanced reader | Fixed bottom bar. Play/pause, skip, progress bar, volume, playlist. |
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

### Flow 4 — First-time visitor onboarding

1. First-time visitor lands on SacredSpace.
2. Sees full-screen welcome with Himalayan imagery and sacred glow overlay — "Begin Journey" CTA.
3. Step 2: Discover Deities — card grid intro, "Find your guiding presence."
4. Step 3: Collective Resonance — "Join thousands in daily chanting."
5. Step 4: Immersive Practice — Sanskrit reading tools intro.
6. **Climax:** Onboarding completes → lands on Home with personalized greeting.

### Flow 5 — Enhanced mantra study (returning seeker)

1. Returning visitor opens a saved mantra from `/saved`.
2. Taps "Enhanced Mode" toggle on the reader.
3. Reader expands with Sanskrit scaling controls, word analysis grid, and audio player.
4. Adjusts Sanskrit font to 140% for easier chanting.
5. Toggles to Transliteration view to practice pronunciation.
6. Taps Play on the audio player — listens while reading along.
7. **Climax:** Word analysis grid shows breakdown of each Sanskrit word with translation — deep understanding without leaving the page.

### Flow 6 — Admin reviews analytics

1. Admin logs in, navigates to `/admin/analytics`.
2. Sees KPI cards: total likes (124.8k), new likes (3,421), most-liked deity (Shiva), top mantra (Gayatri).
3. Line chart shows likes engagement trend over time (gold line, dashed prior period).
4. Donut chart shows like distribution by deity (Shiva 50%, Vishnu 25%, Devi 12%).
5. Table lists top-performing mantras with metrics.
6. **Climax:** Admin identifies that Shiva content drives 50% of engagement — plans to add more Shiva stotras.
