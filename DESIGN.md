---
version: alpha
name: boxistock-design-v2
description: BoxiStock's design language — a dark-mode SaaS dashboard inspired by Wise's design system. A muted lavender-purple primary accent sits on near-black surfaces; Manrope carries both display headings and UI text during the single-font typography trial. Rounded 24px cards and buttons soften the dark palette. Three semantic families — positive green, warning amber, negative red — provide in-product state feedback.

colors:
  primary: "#9180a8"
  on-primary: "#ffffff"
  primary-active: "#b0a3c4"
  primary-neutral: "#8b7aa3"
  primary-pale: "#2d2636"
  ink: "#f8f8f8"
  ink-deep: "#ffffff"
  body: "#a1a1aa"
  mute: "#52525b"
  canvas: "#1a1a1a"
  canvas-soft: "#121212"
  positive: "#4ade80"
  positive-deep: "#166534"
  positive-surface: "#052e16"
  warning: "#fbbf24"
  warning-deep: "#b45309"
  warning-content: "#fef3c7"
  warning-surface: "#431407"
  negative: "#f87171"
  negative-deep: "#b91c1c"
  negative-darkest: "#991b1b"
  negative-bg: "#320707"
  accent-orange: "#ffc091"
  accent-cyan: "#38c8ff"

typography:
  display-mega:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 126px
    fontWeight: 800
    lineHeight: 107px
  display-xxl:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 96px
    fontWeight: 800
    lineHeight: 82px
  display-xl:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 64px
    fontWeight: 800
    lineHeight: 55px
  display-lg:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 47px
    fontWeight: 400
    lineHeight: 71px
    letterSpacing: -0.1px
  display-md:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 34px
  display-sm:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.96px
  display-xs:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 31px
    letterSpacing: -0.48px
  body-lg:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 30px
  body-md:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md-strong:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  body-sm:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm-strong:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  caption:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  badge:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 16px
  button-md:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
    padding: "{spacing.md} {spacing.xl}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md} {spacing.xl}"
  button-secondary:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md} {spacing.xl}"
  button-tertiary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md} {spacing.xl}"
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  card-content:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card-feature-soft:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card-feature-tinted:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card-feature-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  badge-positive:
    backgroundColor: "{colors.positive-surface}"
    textColor: "{colors.positive}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs} {spacing.md}"
  badge-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs} {spacing.md}"
  badge-negative:
    backgroundColor: "{colors.negative-bg}"
    textColor: "{colors.negative}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs} {spacing.md}"
  footer:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: "{spacing.3xl} {spacing.xl}"
  ex-pricing-tier:
    description: "Default tier card — canvas surface on canvas-soft background."
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.mute}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  ex-pricing-tier-featured:
    description: "Featured tier — primary tint surface for emphasis."
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  ex-app-shell-row:
    description: "Sidebar nav row. Active state uses primary purple as the indicator."
    backgroundColor: "{colors.canvas}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md} {spacing.lg}"
  ex-data-table-cell:
    description: "Data-table th + td chrome. Header uses caption typography; body uses body-sm."
    headerBackground: "{colors.canvas-soft}"
    headerTypography: "{typography.caption}"
    bodyTypography: "{typography.body-sm}"
    cellPadding: "{spacing.md} {spacing.lg}"
    rowBorder: "{colors.canvas-soft}"
  ex-modal-card:
    description: "Modal dialog surface — canvas surface with Level 3 elevation."
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  ex-empty-state-card:
    description: "Empty-state illustration frame."
    backgroundColor: "{colors.canvas-soft}"
    rounded: "{rounded.xl}"
    padding: "{spacing.3xl}"
    captionTypography: "{typography.body-md}"
  ex-toast:
    description: "Toast notification — canvas surface, medium shadow."
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md} {spacing.lg}"
    typography: "{typography.body-sm}"
  ex-auth-form-card:
    description: "Sign-in / sign-up card — feature-card chrome with text-input primitives."
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
---

## Overview

BoxiStock's design language takes Wise's system as its structural foundation and inverts the canvas polarity for dark mode. Where Wise uses a sage-tinted canvas with white cards on top, BoxiStock uses a near-black page surface (`{colors.canvas-soft}` `#121212`) with elevated dark cards (`{colors.canvas}` `#1a1a1a`) — the same surface-contrast elevation principle, just dark-side-up. The brand accent is a muted lavender purple (`{colors.primary}` `#9180a8`), occupying the same role Wise's lime green plays: the universal primary action color.

Typography is carried by **Manrope** across both display and UI roles during this single-font trial. Headlines keep their heavy geometric presence at 40–96px, while body, buttons, labels, and dense data views reuse the same family at lighter weights for consistency.

Cards take `{rounded.xl}` 24px — Wise's canonical friendly radius — throughout. Buttons use the same 24px radius, not a pill. This is softer than a classic SaaS UI and more approachable than a purely rectangular grid.

Three semantic families complete the in-product language: **positive green** (`#4ade80`) for success states, **warning amber** (`#fbbf24`) for caution, **negative red** (`#f87171`) for errors and destructive actions. Each family ships with a surface token for dark-mode chip backgrounds so badges work out of the box.

**Key Characteristics:**
- Single dark canvas: `{colors.canvas-soft}` for the page; `{colors.canvas}` for cards. Surface contrast IS elevation.
- Purple primary `{colors.primary}` is the sole brand accent — used on CTAs, focus rings, active nav indicators.
- Manrope for display headings, body text, labels, and controls during the single-font trial.
- `{rounded.xl}` 24px for cards and buttons — the brand's friendly radius.
- Three semantic families with surface tokens — positive, warning, negative — each documented for dark-mode chip use.
- Purple glow shadows (`rgba(145,128,168,…)`) supplement surface-contrast elevation for modals and floating panels.

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — `#9180a8`): The brand purple. Every primary CTA, focus ring, active indicator.
- **Primary Active** (`{colors.primary-active}` — `#b0a3c4`): Lighter purple for hover and active states on the primary button.
- **Primary Neutral** (`{colors.primary-neutral}` — `#8b7aa3`): Mid-saturation purple used for neutral fills and secondary selections.
- **Primary Pale** (`{colors.primary-pale}` — `#2d2636`): Dark purple-tinted surface for chip backgrounds and featured card fills — the subtle brand accent in a surface role.

### Surface
- **Canvas** (`{colors.canvas}` — `#1a1a1a`): Card surfaces, modals, popovers, sidebar. The "elevated" layer.
- **Canvas Soft** (`{colors.canvas-soft}` — `#121212`): The page background — the darkest surface. Cards sit on top, creating contrast-based elevation.

### Text
- **Ink** (`{colors.ink}` — `#f8f8f8`): All primary text on dark surfaces.
- **Ink Deep** (`{colors.ink-deep}` — `#ffffff`): Pure white for maximum-contrast moments (large hero headings, high-emphasis labels).
- **Body** (`{colors.body}` — `#a1a1aa`): Secondary body text, meta labels.
- **Mute** (`{colors.mute}` — `#52525b`): Lowest-priority text — captions, placeholders, fine print.

### Semantic — Positive Family
Three-token green family for success, completion, and in-stock states.
- **Positive** (`{colors.positive}` — `#4ade80`): Success indicator. Text, icons, checkmarks on dark surfaces.
- **Positive Deep** (`{colors.positive-deep}` — `#166534`): Pressed/hover positive; also used as text on `positive-surface` backgrounds when higher contrast is needed.
- **Positive Surface** (`{colors.positive-surface}` — `#052e16`): Very dark green chip/badge background — pairs with `positive` text for status badges.

### Semantic — Warning Family
Three-token amber family for caution, low-stock, and expiry states.
- **Warning** (`{colors.warning}` — `#fbbf24`): Caution indicator. Text and icons on dark surfaces.
- **Warning Deep** (`{colors.warning-deep}` — `#b45309`): Pressed/hover warning state.
- **Warning Content** (`{colors.warning-content}` — `#fef3c7`): Light cream used as text on `warning-surface` backgrounds.
- **Warning Surface** (`{colors.warning-surface}` — `#431407`): Very dark amber chip/badge background — pairs with `warning` text for status badges.

### Semantic — Negative Family
Four-token red family for errors, destructive actions, and out-of-stock states.
- **Negative** (`{colors.negative}` — `#f87171`): Error/destructive indicator on dark surfaces.
- **Negative Deep** (`{colors.negative-deep}` — `#b91c1c`): Hover/pressed destructive state.
- **Negative Darkest** (`{colors.negative-darkest}` — `#991b1b`): Highest-emphasis destructive text in dense views.
- **Negative Bg** (`{colors.negative-bg}` — `#320707`): Dark maroon chip/badge background — pairs with `negative` text.

### Decorative Accents
- **Accent Orange** (`{colors.accent-orange}` — `#ffc091`): Peach for illustrative and chart accents.
- **Accent Cyan** (`{colors.accent-cyan}` — `#38c8ff`): Sky-blue for secondary illustration accents.

## Typography

### Font Family
One face ladders the system:
1. **Manrope Variable** — already loaded in the app (`--font-manrope`). Used across display, body, labels, buttons, and dense UI roles during the single-font trial. Manrope's geometric heaviness at 800 is the closest open-source match to Wise's proprietary display face. Always use weight 800 for display sizes; use 400–600 for utility text.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 126px | 800 | 107px | 0 | Hero / onboarding stencil |
| `{typography.display-xxl}` | 96px | 800 | 82px | 0 | Sub-hero scale |
| `{typography.display-xl}` | 64px | 800 | 55px | 0 | Page title |
| `{typography.display-lg}` | 47px | 400 | 71px | -0.1px | Lighter sub-display |
| `{typography.display-md}` | 40px | 800 | 34px | 0 | Section / card headline |
| `{typography.display-sm}` | 32px | 600 | 38px | -0.96px | Section heading |
| `{typography.display-xs}` | 24px | 600 | 31px | -0.48px | Sub-section heading |
| `{typography.body-lg}` | 20px | 400 | 30px | 0 | Lead paragraphs |
| `{typography.body-md}` | 16px | 400 | 24px | 0 | Default body, form fields |
| `{typography.body-md-strong}` | 16px | 600 | 24px | 0 | Emphasized body |
| `{typography.body-sm}` | 14px | 400 | 20px | 0 | Secondary body, table cells |
| `{typography.body-sm-strong}` | 14px | 600 | 20px | 0 | Bold labels, nav links |
| `{typography.caption}` | 12px | 400 | 16px | 0 | Fine print, table headers |
| `{typography.badge}` | 10px | 500 | 16px | 0 | Compact status badges |
| `{typography.button-md}` | 16px | 600 | 24px | 0 | Button labels |

### Principles
- **Weight 800 for display, weight 600 for sub-display, weight 400 for body.** Clear three-tier weight ladder.
- **Manrope for brand voice and utility.** Use the type scale and weights to create hierarchy instead of switching families.
- **Negative letter-spacing on sub-displays** (`-0.48px` to `-0.96px`) tightens the larger text styles.

## Layout

### Spacing System
- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.2xl}` 32px · `{spacing.3xl}` 48px.
- **Section padding**: 48px top/bottom between major dashboard sections.
- **Card interior**: 24px (`{spacing.xl}`) standard; 12px (`{spacing.md}`) for compact/dense views.

### Grid & Container
- Dashboard uses a sidebar + main content layout with max-content-width ~1280px.
- Data tables and card grids collapse 3-up → 2-up → 1-up based on viewport.
- Reading column for detail/settings pages: ~720–840px centered.

### Whitespace Philosophy
Dense data views use 12–16px between elements. Summary / hero sections open to 48px between content blocks. The contrast between data density and summary whitespace communicates information hierarchy.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No shadow. `canvas` card on `canvas-soft` page — surface contrast IS the elevation. | Default cards on page background. |
| 1 — Hairline | `0 0 0 1px rgba(145,128,168,0.15)` — subtle purple ring. | Hover state, focused inputs, subtle card separation. |
| 2 — Raised | `0 0 0 1px rgba(145,128,168,0.12), 0 2px 8px rgba(0,0,0,0.4)` — purple hairline + soft drop. | Elevated cards, dropdowns, popovers. |
| 3 — Float | `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(145,128,168,0.10)` | Sidebar drawer, command palette. |
| 4 — Overlay | `0 10px 40px -10px rgba(145,128,168,0.4), 0 25px 50px -12px rgba(0,0,0,0.4)` | Modals, full-screen overlays. |

The primary elevation cue is surface contrast: `canvas-soft` (`#121212`) → `canvas` (`#1a1a1a`) → `primary-pale` (`#2d2636`). The purple glow shadow system (Levels 1–4) supplements contrast with a softly branded depth signal.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed bands, table borders. |
| `{rounded.sm}` | 8px | Inline badges, small chips, sidebar row active indicator. |
| `{rounded.md}` | 12px | Form inputs, small secondary cards. |
| `{rounded.lg}` | 16px | Mid-size panels. |
| `{rounded.xl}` | 24px | **The canonical button and card radius.** All primary cards, all buttons. |
| `{rounded.pill}` | 9999px | Status badge pills (badge-positive / badge-negative / badge-warning). |
| `{rounded.full}` | 9999px | Circular icon buttons, avatar containers. |

## Components

### Buttons

**`button-primary`** — the purple CTA.
- Background `{colors.primary}` (`#9180a8`), text `{colors.on-primary}`, label `{typography.button-md}`, padding `{spacing.md} {spacing.xl}`, shape `{rounded.xl}` 24px.
- Active state: background lifts to `{colors.primary-active}` (`#b0a3c4`).

**`button-secondary`** — the dark secondary.
- Background `{colors.canvas-soft}` (`#121212`), text `{colors.ink}`, same typography / padding / shape.

**`button-tertiary`** — the outline tertiary.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.primary}` border, same typography / padding / shape.

**`button-icon-circular`** — the circular icon button.
- Background `{colors.canvas}`, `{colors.ink}` icon, shape `{rounded.full}`.

### Cards & Containers

**`card-content`** — the default card.
- Background `{colors.canvas}` (`#1a1a1a`), text `{colors.ink}`, 1px solid `{colors.ink}` border, padding `{spacing.xl}`, shape `{rounded.xl}`. Surface contrast against `canvas-soft` provides the primary elevation cue; the ink border adds a crisp frame.

**`card-feature-soft`** — the de-emphasis card.
- Background `{colors.canvas-soft}` (`#121212`), text `{colors.ink}`, padding `{spacing.xl}`, shape `{rounded.xl}`. Used to nest subordinate content within a `canvas` panel.

**`card-feature-tinted`** — the purple-tinted accent card.
- Background `{colors.primary-pale}` (`#2d2636`), text `{colors.ink}`, padding `{spacing.xl}`, shape `{rounded.xl}`. Used for featured metrics, onboarding callouts, or summary highlights.

**`card-feature-dark`** — the purple-text dark card.
- Background `{colors.canvas}` (`#1a1a1a`), text `{colors.primary}` (purple text on dark surface!), padding `{spacing.xl}`, shape `{rounded.xl}`. Used for promotional or high-emphasis brand moments.

### Inputs & Forms

**`text-input`** — standard text input.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.body}` border, `{typography.body-md}`, padding `{spacing.md} {spacing.lg}`, shape `{rounded.md}`. Focus: ring `{colors.primary}`.

**`search-input`** — search field with leading icon, used in page headers.
- Built on `text-input`. Left-padded to accommodate the `Search` icon (`pl-9`), height `h-9`, `{typography.body-sm}`.
- Width: `w-full max-w-[360px]` — fluid, caps at 360px, shrinks freely on small screens. Accepts `containerClassName` to override per-usage.
- Pending state: icon pulses (`animate-pulse`) in `{colors.primary}` while a navigation transition is in flight.

### Navigation

**`nav-bar`** — sidebar or top nav header.
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.md} {spacing.xl}`. Active items use `{colors.primary}` as the indicator dot/bar; inactive use `{colors.body}`.

### Status Badges

**`badge-positive`** — in-stock / success state.
- Background `{colors.positive-surface}` (`#052e16`), text `{colors.positive}` (`#4ade80`), `{typography.body-sm-strong}`, padding `{spacing.xs} {spacing.md}`, shape `{rounded.pill}`.

**`badge-warning`** — low-stock / caution state.
- Background `{colors.warning-surface}` (`#431407`), text `{colors.warning}` (`#fbbf24`), same shape.

**`badge-negative`** — out-of-stock / error state.
- Background `{colors.negative-bg}` (`#320707`), text `{colors.negative}` (`#f87171`), same shape.

### App Shell Examples

**`ex-app-shell-row`** — sidebar nav row.
- Background `{colors.canvas}`, active indicator `{colors.primary}`, shape `{rounded.sm}`, padding `{spacing.md} {spacing.lg}`.

**`ex-data-table-cell`** — table chrome.
- Header background `{colors.canvas-soft}`, header type `{typography.caption}`, body type `{typography.body-sm}`, cell padding `{spacing.md} {spacing.lg}`, row border `{colors.canvas-soft}`.

**`ex-modal-card`** — modal dialog.
- Background `{colors.canvas}`, shape `{rounded.xl}`, padding `{spacing.xl}`, Level 4 elevation shadow.

**`ex-toast`** — toast notification.
- Background `{colors.canvas}`, shape `{rounded.xl}`, padding `{spacing.md} {spacing.lg}`, `{typography.body-sm}`, Level 2 elevation.

**`ex-empty-state-card`** — empty-state frame.
- Background `{colors.canvas-soft}`, shape `{rounded.xl}`, padding `{spacing.3xl}`, caption in `{typography.body-md}`.

**`ex-auth-form-card`** — sign-in / sign-up card.
- Background `{colors.canvas}`, shape `{rounded.xl}`, padding `{spacing.xl}`.

## Do's and Don'ts

### Do
- Use `{colors.primary}` purple for every primary CTA. The purple pill IS the brand's conversion signature.
- Set display headings in Manrope weight 800. The heavy geometric cut is the brand's voice.
- Use `{rounded.xl}` 24px for all buttons and cards. The 24px radius is the system's friendliness signature.
- Use surface contrast (`canvas-soft` → `canvas` → `primary-pale`) as the primary elevation cue.
- Use semantic families (positive / warning / negative) for status — never repurpose the primary purple as a success color, since it IS the brand CTA.
- Pair badge backgrounds with their matching foreground: `positive-surface` + `positive`, `warning-surface` + `warning`, `negative-bg` + `negative`.

### Don't
- Don't introduce a second brand accent color. Purple is the sole brand identity color.
- Don't render display headings at weight 700 or lighter. 800 is the minimum for brand moments.
- Don't use `{rounded.pill}` (9999px) for buttons — 24px `{rounded.xl}` is the canonical button shape.
- Don't put `{colors.primary}` purple text on `{colors.primary-pale}` backgrounds — insufficient contrast.
- Don't introduce warm-tinted shadows (orange, yellow glow) — the depth language is purple-glow only (`rgba(145,128,168,…)`).
- Don't use `accent-orange` or `accent-cyan` for semantic states — they are decorative/illustration accents only.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Single-column layout; sidebar drawer; display-mega → ~56px |
| Tablet | 768–1023px | Card grids 2-up; sidebar optional icon-only |
| Desktop | ≥ 1024px | Full sidebar + content; 3-up grids |
| Wide | ≥ 1440px | Wide content columns; max-width 1280px centered |

### Touch Targets
Buttons render ~48px tall (12px vertical padding + 24px line-height). WCAG AAA compliant.
Form fields stay at 44px minimum height across all breakpoints.

### Collapsing Strategy
- Display sizes scale: 96px → 64px → 40px → 32px on mobile.
- Card grids stair-step 3-up → 2-up → 1-up; tinted cards stay visually distinct at every step.
- Sidebar collapses to drawer below 768px; inherits `canvas` background.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference tokens directly (`{colors.primary}`, `{rounded.xl}`, `{typography.display-md}`).
3. Add new variants as separate entries.
4. Default body to `{typography.body-md}`; `{typography.body-lg}` for summary/lead copy only.
5. The 24px radius is non-negotiable for buttons and cards; only badges and circular elements use pill/full.
6. All new shadow values must use `rgba(145,128,168,…)` — never warm or neutral-grey glows.
7. When adding a surface, choose from `canvas-soft`, `canvas`, or `primary-pale` — do not introduce new background hex values.
8. New semantic badges must follow the surface + foreground pairing pattern (`*-surface` bg + `*` text).
