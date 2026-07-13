---
version: alpha
name: BPPedia Design System
description: "An institutional-tech product interface combining Linear's restrained dark surfaces and dense product hierarchy with Vercel's crisp light mode, Geist typography, and precise interaction patterns. The palette is derived from the institution logo without reproducing it: forest green anchors identity, azure blue owns interaction, golden yellow is reserved for warning and rare emphasis, and cool neutrals carry most surfaces."

colors:
  brand: "#0B6B48"
  brand-hover: "#08583C"
  brand-soft: "#E7F3ED"
  brand-soft-dark: "#12382B"
  on-brand: "#FFFFFF"
  primary: "#0878D1"
  primary-hover: "#0667B5"
  primary-pressed: "#075A9B"
  primary-soft: "#E6F2FC"
  primary-soft-dark: "#102F49"
  on-primary: "#FFFFFF"
  warning: "#E3A500"
  warning-deep: "#8A6100"
  warning-soft: "#FFF4CC"
  warning-soft-dark: "#3D310F"
  on-warning: "#241A00"
  destructive: "#B42318"
  destructive-hover: "#912018"
  destructive-soft: "#FEECEB"
  destructive-soft-dark: "#451A18"
  success: "#0D713F"
  success-soft: "#E7F6ED"
  success-soft-dark: "#153A28"
  canvas: "#F7F9F8"
  surface-1: "#FFFFFF"
  surface-2: "#F1F4F3"
  surface-3: "#E9EEEC"
  ink: "#111816"
  ink-muted: "#4C5A55"
  ink-subtle: "#6D7B76"
  hairline: "#DDE4E1"
  hairline-strong: "#B7C3BF"
  dark-canvas: "#07100D"
  dark-surface-1: "#0D1814"
  dark-surface-2: "#13211C"
  dark-surface-3: "#192A23"
  dark-ink: "#F2F7F5"
  dark-ink-muted: "#B7C4BF"
  dark-ink-subtle: "#87968F"
  dark-hairline: "#24372F"
  dark-hairline-strong: "#385047"
  overlay: "#06100CC2"
  selection: "#0878D129"

typography:
  display-xl:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2.0px
  display-lg:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.4px
  display-md:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1.0px
  heading-lg:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.6px
  heading-md:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px
  heading-sm:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  body-lg:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.1px
  body:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.05px
  body-sm:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  label:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  caption:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

motion:
  fast: 150ms
  base: 200ms
  slow: 250ms
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  pressTransform: "translateY(1px)"

components:
  wordmark:
    textColor: "{colors.brand}"
    typography: "{typography.heading-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.md}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.md}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.md}"
  icon-button:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    size: 40px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.sm}"
  text-area:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  popover:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xs}"
  sidebar:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
  nav-item-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.md}"
  link:
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
  focus-ring:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  badge-neutral:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px {spacing.xs}"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px {spacing.xs}"
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px {spacing.xs}"
  status-error:
    backgroundColor: "{colors.destructive-soft}"
    textColor: "{colors.destructive}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px {spacing.xs}"
---

## 1. Design intent

BPPedia is an internal knowledge product for understanding Buku Pedoman Perusahaan. It must feel trustworthy enough for policy content and modern enough to signal fast, AI-assisted retrieval. The system is **institutional tech**: precise, calm, information-first, and distinctly tied to the institution without copying the institution logo.

The design combines selected strengths from two references:

- **Linear:** dense product hierarchy, restrained dark surfaces, compact controls, hairline separation, and minimal decorative color.
- **Vercel:** Geist typography, crisp light surfaces, precise form controls, subtle stacked elevation, and disciplined technical details.
- **BPPedia:** forest green identity, azure interaction, golden warning emphasis, Indonesian product language, and knowledge-centered layouts.

This is a product UI system with one controlled brand-led entry surface. The employee landing page may use a cinematic composition to establish identity, but its hero must still demonstrate the real product through a functional search entry and a credible chat-and-citation product window. Product content, citations, document status, and actions remain the visual priority.

## 2. Brand relationship

The institution logo is currently a **palette source only**. Do not redraw, reinterpret, or place it in the product until approved brand assets and usage rules are available.

The temporary identity treatment is the `BPPedia` wordmark in Geist 600. It must be text, not a newly invented symbol. Forest green connects the wordmark and active navigation to the institution palette without implying an official replacement logo.

### Color hierarchy

The approximate visual ratio is:

- **85% cool neutrals:** canvas, surfaces, borders, and text.
- **10% forest green:** wordmark, active navigation, and identity-level emphasis.
- **4% azure blue:** primary actions, links, selection, and focus.
- **1% golden yellow:** warnings and rare highlighted information.

These colors are not three equal accents. Every color has one stable job:

| Role | Color | Purpose |
|---|---|---|
| Identity | Forest green | Brand recognition and current location |
| Interaction | Azure blue | CTA, link, focus, selected interactive state |
| Attention | Golden yellow | Warning, processing caution, rare highlight |
| Destructive | Red | Errors and destructive actions only |
| Success | Green semantic tone | Completed or healthy operational status |

Never use green and blue as competing primary CTAs in the same context. The primary action is always blue. Green indicates identity or location.

## 3. Theme architecture

The default theme follows the operating-system preference. Users may switch themes when a theme control is available.

### Light mode

Light mode takes its structural clarity from Vercel: a cool off-white canvas, white primary surfaces, quiet inset surfaces, dark green-tinted ink, and crisp hairlines. Cards use a border plus a very subtle stacked shadow only when elevation communicates hierarchy.

Surface order:

1. `canvas` — page background.
2. `surface-1` — cards, inputs, dialogs.
3. `surface-2` — sidebar, grouped regions, hover backgrounds.
4. `surface-3` — selected neutral states and inset controls.

### Dark mode

Dark mode takes its restraint from Linear without copying Linear's lavender palette. The canvas is a green-tinted off-black rather than pure black. Each lifted surface becomes slightly lighter and warmer. Hairlines, not glow, carry most depth.

Surface order:

1. `dark-canvas` — page background.
2. `dark-surface-1` — cards, inputs, dialogs.
3. `dark-surface-2` — sidebar, grouped regions, hover backgrounds.
4. `dark-surface-3` — selected neutral states and elevated controls.

Dark-mode semantic soft backgrounds use their explicit `*-soft-dark` tokens. Never reuse pale light-mode fills in dark mode.

## 4. Typography

Geist and Geist Mono are already part of the application foundation and remain the only type families.

- **Geist 600:** page titles, section headings, wordmark.
- **Geist 500:** labels, buttons, navigation emphasis.
- **Geist 400:** body text and supporting copy.
- **Geist Mono 400:** document IDs, versions, timestamps where alignment matters, code, and technical metadata.

Product typography stops at 48px. The employee landing hero is the single controlled exception: it may scale beyond 48px at desktop when the heading remains within three lines, preserves comfortable gutters, and collapses safely on mobile. All other headings use sentence case and restrained negative tracking. Body copy remains readable at 14–16px with generous line height. Policy excerpts and long answers target a readable line length of 60–75 characters.

## 5. Shape, spacing, and density

The spacing system uses a 4px base. Product controls are compact but retain accessible touch targets.

- Default control height: 40px.
- Minimum touch target: 44×44px on touch-first layouts, provided through visual size or hit-area padding.
- Inputs and buttons: 6–8px radius.
- Cards and dialogs: 12px radius.
- Large document or preview frames: 16px maximum.
- Full pills: badges, statuses, filters, and avatars only.

The interface uses negative space and dividers before adding cards. Do not wrap every text group, metric, or toolbar in a separate container. A card is justified only when content needs grouping, elevation, selection, or independent interaction.

## 6. Elevation

Depth is functional, restrained, and theme-aware.

| Level | Treatment | Use |
|---|---|---|
| 0 | No shadow; optional divider | Page content, lists, reading surfaces |
| 1 | Hairline plus subtle inset highlight | Cards, inputs, sidebars |
| 2 | Small stacked shadow plus hairline | Popovers, dropdowns, sticky composer |
| 3 | Wider soft stacked shadow plus overlay | Dialogs and modal surfaces |
| Focus | 2px azure ring with 2px offset | Keyboard focus only |

Avoid neon outer glows, large ambient shadows, and glass effects on scrolling content. A faint green-to-blue tonal transition may appear only in a large, non-interactive identity surface such as an empty-state backdrop. It must remain subtle, never carry text contrast, and never become a general component fill.

## 7. Components

### Wordmark

Use `BPPedia` as a text wordmark in forest green on light surfaces and a lighter brand tone on dark surfaces. Keep it left-aligned in application chrome. Do not add a generated symbol, sparkle, robot, book icon, or logo approximation.

### Buttons

- Primary actions use azure blue.
- Secondary actions use the current surface plus hairline.
- Tertiary actions are text or ghost controls.
- Destructive actions use red only when the action is genuinely destructive.
- Hover changes tone without increasing saturation dramatically.
- Active state translates down 1px.
- Disabled state reduces contrast while remaining legible.
- Buttons use 6–8px radii, not marketing pills.

### Inputs

Labels sit above inputs. Helper and error text sit below. Focus uses the azure ring. Validation must not rely on color alone: pair semantic color with text and, where useful, a precise line icon. Placeholder text must meet non-essential contrast expectations without competing with entered values.

### Navigation

Forest green marks product identity and the active location. Blue remains reserved for actions inside the current view. Active navigation uses a soft green background and green text; it does not use a thick colored bar when a filled state is clearer.

### Cards and panels

Use cards for document groups, actionable previews, dialogs, and independently interactive blocks. Reading content, answer text, tables, and dense admin lists should prefer open surfaces with dividers. Avoid nested cards unless an inner region has a separate interaction or elevation level.

### Status and badges

- Neutral: metadata and categories.
- Green: complete, published, healthy.
- Yellow: processing, caution, attention required.
- Red: failed, blocked, destructive.
- Blue: informational interactive state, not operational success.

Status always includes a text label. Color is supplemental.

### Employee landing hero

The employee landing combines brand-led cinematic composition with a direct product entry point.

- Left side: `BPPedia` wordmark, concise value proposition, and one primary search composer.
- Right side: a polished product window showing a believable assistant answer, source citation, document version, and active status.
- The product window replaces abstract ribbon artwork. It must look like a real application preview, not a decorative fake dashboard.
- On mobile, the search composer precedes the product window in a single column.
- The composer uses forest only for identity cues, azure for submit and focus, and gold only for caution states.

The landing does not answer the question itself. It hands the question to the chat flow.

### Optimistic chat handoff

Submitting a non-empty landing query follows this contract:

1. Generate the new chat identifier using the same ID utility as the chat feature.
2. Navigate to `/chat/{id}`.
3. Render the submitted query immediately as the first user message.
4. Show the assistant response state as loading while the chat request begins.
5. Preserve the query through navigation without placing sensitive text in the URL.
6. On submission failure, retain the query and expose a retry path without creating duplicate chats.

This is an ALF-48 behavior contract. ALF-46 defines the visual roles consumed by the composer, optimistic message, loading state, citation, and status; it does not implement chat creation or persistence.

## 8. Motion

Motion provides feedback; it is not decoration.

- Hover and focus transitions: 150ms.
- Standard state changes: 200ms.
- Popover/dialog transitions: up to 250ms.
- Use `cubic-bezier(0.22, 1, 0.36, 1)` for a controlled spring-like finish.
- Animate opacity and transform only.
- Use skeletons matching the final layout for loading.
- Avoid perpetual animation except an essential processing indicator.
- Avoid magnetic controls, parallax, scroll hijacking, animated background meshes, and decorative looping motion.
- Respect `prefers-reduced-motion`; remove non-essential transforms and transitions.

## 9. Responsive behavior

The product is desktop-capable but must remain fully usable on mobile.

- Mobile: single-column content, 16px gutters, 44px touch targets.
- Tablet: content may split into navigation plus main region where space permits.
- Desktop: cap reading width while allowing admin tables and document previews to use available space.
- Asymmetric desktop composition must collapse to one column below 768px.
- Avoid horizontal scrolling except for intentionally scrollable tables with a visible affordance.
- Use `min-height: 100dvh` for viewport-filling shells; never `100vh` alone.

## 10. Accessibility

- Text and essential icons meet WCAG AA contrast.
- Focus is visible for keyboard users and never removed without replacement.
- Interactive controls have accessible names and discernible disabled states.
- Touch targets reach 44×44px on touch layouts.
- Semantic states combine color with text or iconography.
- Theme switching preserves contrast and component meaning.
- Reduced-motion preferences are honored.
- Existing component accessibility must not regress.

## 11. Exclusions and controlled exceptions

The system excludes patterns that conflict with an internal knowledge application, not every expressive technique from the references.

### Excluded

- Linear lavender as a BPPedia accent.
- Vercel rainbow or multi-stop marketing mesh gradients.
- Giant marketing headlines outside the employee landing hero exception.
- Hero headings that exceed three lines or compromise mobile readability.
- Pill-shaped primary CTAs.
- Neon or decorative outer glows.
- Heavy single drop shadows.
- Decorative glassmorphism on scrolling content.
- Excessive cards and cards nested only for appearance.
- Perpetual decorative motion, parallax, and scroll hijacking.
- A newly invented icon pretending to be the institution logo.

### Allowed in controlled contexts

- A subtle forest-to-azure tonal transition in one large identity or empty-state surface.
- One cinematic employee landing composition with restrained GSAP reveal and scroll choreography.
- A product-window hero visual containing chat, citation, document version, and status cues.
- A soft focus halo that is part of the accessible azure focus treatment.
- Pills for badges, statuses, compact filters, and avatars.
- Cards when grouping, interaction, selection, or elevation requires them.
- Short processing motion and skeleton shimmer when they communicate system state.
- Semantic red, yellow, and green where operational meaning requires them.

## 12. Implementation boundaries for ALF-46

ALF-46 establishes shared foundations only:

- semantic light and dark color tokens;
- typography roles using existing Geist fonts;
- spacing, radii, elevation, and motion tokens;
- BPPedia text wordmark treatment;
- theme metadata aligned with the active theme;
- shared focus and reduced-motion behavior;
- representative shared primitives needed to prove token consumption.

ALF-46 may retain `/design-review` as a disposable visual prototype for reviewing the system, but it does not ship the employee landing screen, chat handoff, admin login screen, document-management workflows, or other feature-specific compositions. ALF-48 consumes this system to build the employee landing, replace the abstract ribbon with the product window, and implement the optimistic chat handoff contract.

The implementation should preserve the existing Tailwind v4 semantic bridge in `app/globals.css`. Components consume semantic roles such as `background`, `foreground`, `primary`, `brand`, `warning`, and `border`; raw brand values must not be scattered across JSX.

## 13. Verification

Automated verification:

- Run the repository formatter/linter.
- Run TypeScript without emitting output.
- Run the existing route and frontend smoke tests affected by global visual changes.
- Verify no raw institution palette values are duplicated across component files.
- In ALF-48, add an end-to-end check that landing submit creates one chat route, preserves the query as the first optimistic message, and shows assistant loading without placing the query in the URL.

Manual verification:

- Confirm first load follows the OS theme.
- Inspect light and dark modes on employee and admin route foundations.
- Check keyboard focus on links, buttons, inputs, dialogs, and navigation.
- Check text, focus, and semantic status contrast.
- Enable reduced motion and confirm non-essential transitions stop.
- Test mobile, tablet, and desktop widths.
- Confirm forest green signals identity, blue signals interaction, and yellow remains rare.
- Confirm the cinematic prototype remains legible with motion disabled.
- Confirm the hero product window reads as chat plus citation, not as abstract logo artwork or a generic dashboard.
- Confirm no feature-specific screen was shipped under ALF-46.

## 14. Reference decisions

| Reference trait | Decision | BPPedia adaptation |
|---|---|---|
| Linear dark canvas | Adopt | Green-tinted off-black surface ladder |
| Linear lavender accent | Reject | Institution-derived forest plus azure roles |
| Linear compact product controls | Adopt | 40px controls, 6–8px radii |
| Linear hairline hierarchy | Adopt | Theme-aware neutral/green-tinted hairlines |
| Vercel Geist typography | Adopt | Existing Geist and Geist Mono only |
| Vercel crisp light mode | Adopt | Cool off-white canvas and white surfaces |
| Vercel stacked elevation | Adapt | Subtle and limited to functional elevation |
| Vercel marketing pills | Reject | Pills restricted to badges and filters |
| Vercel mesh gradient | Reject by default | One subtle forest-to-azure exception only |
| Reference marketing scale | Adapt | 48px product ceiling; larger type only in the employee landing hero |
