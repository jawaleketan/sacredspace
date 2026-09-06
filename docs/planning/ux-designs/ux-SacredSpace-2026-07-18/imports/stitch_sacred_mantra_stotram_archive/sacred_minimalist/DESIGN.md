---
name: Sacred Minimalist
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3a3937'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1c1b1a'
  surface-container: '#201f1e'
  surface-container-high: '#2b2a28'
  surface-container-highest: '#363533'
  on-surface: '#e6e2de'
  on-surface-variant: '#d2c5b1'
  inverse-surface: '#e6e2de'
  inverse-on-surface: '#31302e'
  outline: '#9a8f7e'
  outline-variant: '#4e4637'
  surface-tint: '#eec060'
  primary: '#f2c363'
  on-primary: '#402d00'
  primary-container: '#d4a84b'
  on-primary-container: '#563e00'
  inverse-primary: '#7a5900'
  secondary: '#ffb870'
  on-secondary: '#4a2800'
  secondary-container: '#ce7e1a'
  on-secondary-container: '#402300'
  tertiary: '#cbc9c6'
  on-tertiary: '#30312e'
  tertiary-container: '#afaeaa'
  on-tertiary-container: '#41423f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea2'
  primary-fixed-dim: '#eec060'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5c4200'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb870'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#e4e2de'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#141312'
  on-background: '#e6e2de'
  surface-variant: '#363533'
typography:
  headline-display:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is built for an experience that evokes tranquility, wisdom, and ritual. The target audience seeks mindfulness and depth, requiring a UI that feels like a digital sanctuary. 

The aesthetic is a fusion of **Minimalism** and **Tactile Sophistication**. It prioritizes heavy whitespace (or "negative space") to allow content to breathe, while utilizing subtle light-leaks and glow effects to create a sense of the "sacred." The emotional response should be one of immediate calm, intellectual clarity, and premium craftsmanship. It avoids the coldness of traditional tech minimalism by using organic, warm color palettes and deliberate, rhythmic transitions.

## Colors
The palette is centered on a "Sacred Dark" theme. The foundation is **Deep Charcoal/Espresso** (#31302e), providing a grounded, low-fatigue surface that feels more organic than pure black. 

**Warm Ivory** (#f3f1ed) serves as the primary ink, ensuring high legibility while maintaining a soft, paper-like quality that reduces eye strain. **Gold** (#d4a84b) is the primary accent, used for high-importance actions and signals of "enlightenment." **Saffron** (#f59e3b) acts as the secondary accent, reserved for interactive states and warm notifications. 

Accents in dark mode should employ a "sacred glow"—a subtle outer bloom or shadow-glow using the accent color at low opacity (15-20%) to simulate light emitting from within the dark surface. Theme transitions are "serene," utilizing a 400ms duration to allow the eye to adjust comfortably to changing luminance.

## Typography
The typography system balances the intellectual authority of **Noto Serif** with the modern, approachable clarity of **Plus Jakarta Sans**. 

- **Headlines:** Use Noto Serif for all headings to establish a literary and refined tone. Display sizes use tighter letter spacing to create a cohesive visual block.
- **Body & UI:** Plus Jakarta Sans is used for all functional text. Its soft, rounded terminals complement the "serene" brand personality while ensuring maximum readability on dark backgrounds.
- **Labels:** Labels use uppercase with increased letter spacing to provide a clear hierarchy and a "designed" feel for metadata and small buttons.

## Layout & Spacing
This design system utilizes a **Fixed Grid** on desktop and a **Fluid Grid** on mobile. The layout is driven by a vertical rhythm based on 8px increments.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters. Large 64px outer margins create a "framed" gallery feel.
- **Mobile:** 4-column fluid grid with 20px margins. 
- **Rhythm:** Generous "Stack" spacing (48px+) is encouraged between major sections to prevent visual clutter and maintain the minimalist intent. Content should be centered to maintain a sense of balance and focus.

## Elevation & Depth
Depth is expressed through **Tonal Layers** rather than heavy shadows. In this dark mode environment, higher elevation is represented by lighter surface colors.

- **Level 0 (Base):** Deep Charcoal/Espresso (#31302e).
- **Level 1 (Cards/Surfaces):** A slightly lifted tint (Base + 4% White overlay).
- **Level 2 (Modals/Popovers):** A further lifted tint (Base + 8% White overlay).
- **Glow:** Interactive elements (Active buttons, selected states) use a "Sacred Glow"—a soft Gaussian blur of the Primary Gold color at 15% opacity positioned behind the element to suggest it is radiating light.
- **Outlines:** Use low-contrast Ivory outlines (10% opacity) for input fields and secondary containers to maintain structure without breaking the dark immersion.

## Shapes
The shape language is **Rounded**, echoing the organic nature of the brand. 
- **Standard elements (Buttons, Inputs):** 0.5rem (8px) radius.
- **Large elements (Cards, Containers):** 1rem (16px) radius.
- **Decorative elements:** Use 1.5rem (24px) for a "pill-like" soft aesthetic in chips or featured tags.
Edges should feel soft to the touch, avoiding the aggressive sharpness of pure brutalism or the childishness of full pill-shapes for everything.

## Components
- **Buttons:** Primary buttons are solid Gold (#d4a84b) with Espresso text. They feature a subtle outer glow on hover. Secondary buttons use an Ivory outline (20% opacity) with Ivory text.
- **Cards:** Cards use the Level 1 surface tint with no border. They rely on the subtle contrast against the Level 0 background for definition.
- **Inputs:** Fields are Espresso with a 1px Ivory border at 10% opacity. Upon focus, the border transitions to Gold with a 4px Gold outer glow (15% opacity).
- **Chips:** Small, pill-shaped containers with a 5% Ivory fill and 12px label text. Used for categorization without drawing excessive attention.
- **Transitions:** All hover and active states must follow the "serene" timing (400ms) with a smooth ease-in-out curve to maintain the tranquil experience.
- **Lists:** Use generous 16px padding between items, separated by a thin (1px) line of Ivory at 5% opacity.