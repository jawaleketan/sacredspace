---
name: Serene Editorial
colors:
  surface: '#fbf9f7'
  surface-dim: '#E0DDD8'
  surface-bright: '#fbf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f1'
  surface-container: '#EFECE8'
  surface-container-high: '#eae8e6'
  surface-container-highest: '#e4e2e0'
  on-surface: '#1b1c1b'
  on-surface-variant: '#4e453d'
  inverse-surface: '#30302f'
  inverse-on-surface: '#f2f0ee'
  outline: '#7A7874'
  outline-variant: '#d1c4ba'
  surface-tint: '#705a44'
  primary: '#352512'
  on-primary: '#ffffff'
  primary-container: '#4d3a26'
  on-primary-container: '#bfa48a'
  inverse-primary: '#dec1a6'
  secondary: '#745a38'
  on-secondary: '#ffffff'
  secondary-container: '#fedab0'
  on-secondary-container: '#785e3c'
  tertiary: '#262a11'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c4025'
  on-tertiary-container: '#a8ac89'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fbddc1'
  primary-fixed-dim: '#dec1a6'
  on-primary-fixed: '#281807'
  on-primary-fixed-variant: '#57432e'
  secondary-fixed: '#ffddb6'
  secondary-fixed-dim: '#e3c198'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#5a4223'
  tertiary-fixed: '#e2e6bf'
  tertiary-fixed-dim: '#c6c9a5'
  on-tertiary-fixed: '#1a1d06'
  on-tertiary-fixed-variant: '#45492d'
  background: '#fbf9f7'
  on-background: '#1b1c1b'
  surface-variant: '#e4e2e0'
  gold: '#D4A84B'
  saffron: '#F59E3B'
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
  sanskrit:
    fontFamily: Noto Sans Devanagari
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '2.0'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 64px
  reading-width: 720px
---

## Brand & Style

This design system is built upon the concept of "Serene Editorial Minimalism." It aims to create a digital sanctuary that feels quiet, reverent, and deeply focused. The aesthetic avoids the coldness of modern tech by using a warm, organic palette and timeless typography.

The personality is intellectual yet spiritual, combining the structural clarity of a modern SaaS platform with the grace of a high-end literary journal. The emotional goal is to evoke a sense of calm and focus, inviting users into a state of contemplation and study. The style leverages a **Minimalist** foundation with **Tonal Layering** to create depth without visual noise.

## Colors

The palette is rooted in the earth and traditional manuscripts. **Warm Ivory** serves as the primary surface color to reduce eye strain and provide a soft, welcoming background. **Espresso** is used as the primary "ink," ensuring high legibility while maintaining a softer profile than pure black.

**Gold** and **Saffron** are reserved for moments of significance—interactive states, sacred highlights, or secondary actions. These should be used with restraint to maintain their impact. Tonal variations of the neutral base (Stone tones) are used to define structural depth and hierarchy between content containers.

## Typography

The typography system follows a dual-pathway approach. **Cormorant Garamond** provides the "sacred voice"—elegant, tall, and authoritative for headings and titles. **Inter** handles the functional "commentary"—the body text, metadata, and labels that require clarity and efficiency.

A dedicated role is established for **Sanskrit/Devanagari** text. To accommodate the complex glyphs and ensure comfortable chanting/reading, it is rendered significantly larger than standard body copy with a very generous line height. All labels utilize increased letter spacing to create an airy, premium feel across the UI.

## Layout & Spacing

This design system employs a **Fluid Grid** model with strict constraints on reading environments. Desktop layouts use a 12-column grid, while mobile scales down to a single-column layout with 16px margins. 

To maintain the editorial feel, vertical rhythm is prioritized over horizontal density. Major content sections are separated by a 64px gap to ensure breathability. For long-form text (mantras and stotras), the content container is capped at a 720px width and centered, mimicking the layout of a physical book or traditional scroll to optimize for focus and readability.

## Elevation & Depth

Depth in this design system is primarily achieved through **Tonal Layers**. Instead of using heavy shadows, hierarchy is defined by shifting surface colors—placing light containers on slightly darker "dimmed" backgrounds.

When absolute separation is required (such as in modals or floating action buttons), use **Ambient Shadows**. These should be highly diffused, using a tinted shadow color (`#4D3A26` at 6% opacity) rather than a neutral gray, to maintain the warmth of the palette. Borders should be used sparingly as "ghost lines" (1px thickness) to define boundaries without adding visual weight.

## Shapes

The shape language is **Rounded**, conveying a sense of softness and approachability. 

- Use the base `rounded` (0.5rem) for standard interactive elements like buttons and input fields.
- Use `rounded-lg` (1rem) for God Cards and primary content containers to give them a distinct, object-like quality. 
- Circular shapes (pill-shaped) should only be used for small badges or specific status indicators to keep the overall aesthetic structured and grounded.

## Components

- **God Cards**: High-visibility components featuring deity iconography. Use `rounded-lg` with a subtle tonal background. On hover, apply a soft ambient shadow and a slight vertical lift (2-4px).
- **Mantra Cards**: Clean, list-based items. Titles in `headline-sm` (Cormorant Garamond) with metadata labels in `label-sm` (Inter).
- **Buttons**:
    - **Primary**: Solid Espresso fill with White text.
    - **Accent**: Gold fill for primary interactions related to "Sacred" actions (Saving, Hearting).
    - **Ghost**: Outline style using the `outline-variant` color for secondary actions.
- **Input Fields**: Minimalist design with a 1px bottom border or a very light container fill. No heavy borders. 
- **Sanskrit Display**: Always paired with a translated equivalent. The Sanskrit text must be given primary visual weight through its dedicated typography scale.
- **Navigation**: Desktop uses a wide, airy header with a focus on search. Mobile uses a bottom tab bar for easy reachability during one-handed use.