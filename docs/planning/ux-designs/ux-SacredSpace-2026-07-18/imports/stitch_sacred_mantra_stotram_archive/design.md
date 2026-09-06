---
name: SacredSpace
status: final
colors:
  surface: '#faf8f6'
  surface-dim: '#e0ddd8'
  surface-bright: '#fdfcfb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efece8'
  surface-container-high: '#e9e6e2'
  surface-container-highest: '#e3e0dc'
  on-surface: '#1c1b1a'
  on-surface-variant: '#494845'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f3f1ed'
  outline: '#7a7874'
  outline-variant: '#cbc8c3'
  surface-tint: '#5f4a33'
  primary: '#4d3a26'
  on-primary: '#ffffff'
  primary-container: '#6b543c'
  on-primary-container: '#f5dcc4'
  inverse-primary: '#e7cdb5'
  secondary: '#8b6f4c'
  on-secondary: '#ffffff'
  secondary-container: '#ebd0b0'
  on-secondary-container: '#3f2c18'
  tertiary: '#5c6042'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0e5bf'
  on-tertiary-container: '#1a1d07'
  accent-gold: '#d4a84b'
  accent-saffron: '#f59e3b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#faf8f6'
  on-background: '#1c1b1a'
  surface-variant: '#e3e0dc'
typography:
  display-lg:
    fontFamily: Cormorant Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Cormorant Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.15'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Cormorant Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Cormorant Garamond
    fontSize: 26px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Cormorant Garamond
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.7'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  sanskrit:
    fontFamily: Noto Sans Devanagari
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '2.0'
rounded:
  sm: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 64px
---

## Brand & Style

SacredSpace embodies **Serene Editorial Minimalism** — a clean, calm digital sanctuary for spiritual texts. Design decisions prioritize readability, breathability, and a sense of quiet reverence. The aesthetic draws from modern editorial design with subtle nods to traditional Indian manuscript aesthetics through accent colors and type.

The experience should feel like stepping into a peaceful library — uncluttered, warm, and focused on the content.

## Colors

- **Warm Ivory (#FAF8F6)** is the primary surface — soft, non-clinical, reduces eye strain during long readings.
- **Warm Stone tones** (`surface-dim` through `surface-container-highest`) provide gentle structural depth for cards, navigation, and dividers.
- **Espresso (#4D3A26)** is the primary ink for high-contrast typography and essential UI.
- **Gold (#D4A84B)** and **Saffron (#F59E3B)** serve as sacred accents — used sparingly for interactive elements (like buttons), icon states (liked/hearted), and semantic highlights.
- **Dark mode** inverts: deep charcoal surfaces (`inverse-surface`) with warm ivory text (`inverse-on-surface`). Accent gold/saffron remain prominent.

## Typography

- **Cormorant Garamond** is the voice of the sacred text — a refined, elegant serif for headings and mantra titles. Its classic proportions convey tradition and gravitas.
- **Inter** provides a clean, modern counterpoint for body copy, navigation, labels, and metadata. Crisp and highly readable at all sizes.
- **Noto Sans Devanagari** renders Sanskrit/Devanagari text with proper glyph support. Larger size (20px) and generous line-height (2.0) for chant-readability.
- Labels are tracked out slightly (0.05em) for a premium, airy feel.

## Layout & Spacing

- **12-column responsive grid** on desktop, collapsing to single-column on mobile.
- Generous vertical rhythm — `section-gap` (64px) between major content blocks.
- Mantra/stotra text pages use a constrained reading width (max ~720px) centered on screen.
- Mobile margins at 16px, desktop at 48px.
- Content leans vertical — scroll-driven discovery, minimal horizontal navigation.

## Elevation & Depth

- Depth is conveyed through **tonal layering** (surface color stack) rather than heavy shadows.
- Shadows when used: soft, low-opacity (`rgba(77, 58, 38, 0.06)`) with moderate blur (12-16px).
- Borders are 1px `outline-variant` — subtle ghost lines, never harsh strokes.

## Shapes

- **Soft (0.5rem)** corner radius as default — approachable but not pill-shaped.
- God cards use `rounded-lg` (0.75rem) for a distinct, object-like quality.
- Buttons use `rounded-md` (0.5rem).

## Components

- **God cards** — large rounded cards with deity illustration/icon and name centered. Subtle hover elevation lift.
- **Mantra cards** — compact cards with title, deity tag, and word count. Tap leads to detail.
- **Primary buttons** — Solid `primary` fill with white text (`on-primary`). Accent gold variant for "heart/like" toggle.
- **Hearts** — outline icon in neutral, filled gold (`accent-gold`) when liked.
- **Share/Save** — icon-only buttons with tooltip on hover.
- **Navigation** — top header bar (logo + search) on desktop; bottom tab bar on mobile (Home, Browse, Saved).
- **Dashboard** — sidebar layout on desktop, top tab bar on mobile. Clean card-based content list with status badges.

## Do's and Don'ts

- **Do** keep generous white space — let the text breathe
- **Do** use gold/saffron sparingly — they lose impact if overused
- **Don't** use heavy borders or aggressive shadows
- **Don't** use playful or casual typography — maintain reverence
- **Do** ensure Devanagari text is significantly larger than body copy for chant-readability
