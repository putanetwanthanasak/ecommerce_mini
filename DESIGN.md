---
name: Commerce
description: A split-flap departures board for a store whose stock counts are guaranteed by the transaction that prints them.
colors:
  board: "oklch(21.5% 0.012 240)"
  surface-sunken: "oklch(21.5% 0.012 240)"
  surface: "oklch(26% 0.012 240)"
  surface-muted: "oklch(31% 0.013 240)"
  skeleton: "oklch(31% 0.013 240)"
  hairline: "oklch(33% 0.012 240)"
  edge: "oklch(42% 0.013 240)"
  ink: "oklch(94% 0.004 240)"
  ink-muted: "oklch(80% 0.006 240)"
  ink-subtle: "oklch(68% 0.008 240)"
  ink-faint: "oklch(62% 0.009 240)"
  amber: "oklch(80% 0.135 78)"
  amber-surface: "oklch(28% 0.045 78)"
  caution-edge: "oklch(40% 0.075 78)"
  signal: "oklch(74% 0.105 155)"
  signal-surface: "oklch(27% 0.038 155)"
  positive-edge: "oklch(38% 0.065 155)"
  alert: "oklch(70% 0.145 27)"
  alert-surface: "oklch(27% 0.055 27)"
  critical-edge: "oklch(38% 0.09 27)"
  info: "oklch(76% 0.075 235)"
  info-surface: "oklch(27% 0.032 235)"
  info-edge: "oklch(40% 0.055 235)"
  focus: "oklch(80% 0.135 78)"
typography:
  rail:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
    fontVariation: "wdth 88"
  meta:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  row:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
    fontVariation: "wdth 82"
  figure:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontVariation: "wdth 80"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 1.2rem + 2vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontVariation: "wdth 82"
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 1.5rem + 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "wdth 80"
    fontFeature: "tabular-nums"
rounded:
  control: "0.375rem"
  panel: "0.5rem"
spacing:
  hairline: "1px"
  row-y: "1rem"
  column-gap: "1rem"
  row-x: "1.25rem"
  panel: "1.5rem"
  gutter: "1.5rem"
  section: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.board}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "#ffffff"
    textColor: "{colors.board}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink-faint}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
    height: "2.75rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.alert-surface}"
    textColor: "{colors.alert}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.75rem"
  button-sm:
    padding: "0.375rem 0.75rem"
  button-icon:
    height: "2rem"
    width: "2rem"
  badge-neutral:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink-subtle}"
    rounded: "{rounded.control}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.rail}"
  badge-caution:
    backgroundColor: "{colors.amber-surface}"
    textColor: "{colors.amber}"
    rounded: "{rounded.control}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.rail}"
  badge-positive:
    backgroundColor: "{colors.signal-surface}"
    textColor: "{colors.signal}"
    rounded: "{rounded.control}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.rail}"
  badge-critical:
    backgroundColor: "{colors.alert-surface}"
    textColor: "{colors.alert}"
    rounded: "{rounded.control}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.rail}"
  badge-info:
    backgroundColor: "{colors.info-surface}"
    textColor: "{colors.info}"
    rounded: "{rounded.control}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.rail}"
  flap:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  board-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "1rem 1.25rem"
  board-row-hover:
    backgroundColor: "{colors.surface-muted}"
  board-row-soldout:
    backgroundColor: "{colors.board}"
  column-rail:
    textColor: "{colors.ink-subtle}"
    typography: "{typography.rail}"
    padding: "0 1.25rem 0.5rem"
  input-field:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
    typography: "{typography.meta}"
  input-field-error:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
  nav-tab:
    textColor: "{colors.ink-subtle}"
    typography: "{typography.meta}"
    padding: "0 0.25rem 0.5rem"
  nav-tab-selected:
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    padding: "0 0.25rem 0.5rem"
  wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.row}"
---

# Design System: Commerce

## Overview

**Creative North Star: "The Departures Board"**

A split-flap arrivals board exists for one reason: to make a changing number trustworthy at a glance. This store's stock counts are guaranteed by a database transaction that cannot oversell, so the board is the medium here rather than a metaphor — the interface is doing the same job as the mechanism it is drawn from. Every decision below follows from that. The catalog is rows on a dark enamelled board, not cards on a white page, because a board is rows precisely so that every price lands in one column, on one baseline, where a person can run their eye down it and compare.

The world is deliberately dark and single-polarity: a concourse board at dusk, the only lit surface in view. Flaps are matte cards one shade above the board, never white ones — a real Solari variant, and the reason nothing in the system needs a shadow. Depth comes from three close steps of dark and a 1px chassis hairline; that hairline is the entire elevation vocabulary. Archivo, self-hosted with both variable axes, supplies the board's own grammar: condensed tracked caps for rails and labels, tabular condensed figures for money and counts, normal width for prose. Hierarchy escalates by narrowing before it escalates by growing.

The refusal that shapes the catalog is explicit: there is no product photography and no database column that could hold any, so the white product card with an empty image slot is rejected outright. A row admits there is no picture and gets denser instead. What is left to look at — name, category, stock, price — is what the type has to carry, and it does. The wordmark currently reads "Commerce" and is a confirmed placeholder; the type treatment it is set in is not.

**Key Characteristics:**

- One polarity: light-on-dark everywhere, no light variant.
- Amber is reserved for what can still change — nowhere else.
- Rows and rails, never cards and shadows. Zero `box-shadow` in the entire app.
- Width as hierarchy: condensed lettering for board voice, normal width for reading.
- Every number a person compares is set in tabular condensed figures, in a fixed column.
- Exactly one authored motion: the stock figure's flap turn.

## Colors

Three close steps of dark carry every surface, four steps of near-white carry every piece of text, and three signal hues — amber, green, red — say only what state something is in. Authored in **oklch**, because the ink steps were contrast-checked against the flap and lightness had to be a number worth trusting.

### Primary

- **Board Enamel** (`board`): the enamelled board behind everything. The page ground (`surface-sunken` is its alias), the header rail, the fill of every input, and what a sold-out row drops back to. It is darker than the flaps on top of it, so the header reads as the chassis the mechanism is mounted in.
- **Flap Matte** (`surface`): one printed card on the board. Panels, list rows, the auth card, every `hairline-grid` cell.
- **Flap Lifted** (`surface-muted`): a flap under the pointer, and the fill of a neutral badge. `skeleton` shares its value and marks a flap not yet printed.

### Secondary

- **Reserved Amber** (`amber`): a figure that can still change. The stock count below the low threshold, a PENDING order's badge, the focus ring, the text caret, `::selection`, and the hover state of a link into a product. Nothing static. `amber-surface` is its tinted panel, `caution-edge` its border.
- **Settled Green** (`signal`): the flap has stopped turning. Stock in hand, a SHIPPED order, the post-checkout confirmation panel. `signal-surface` / `positive-edge` complete the family.
- **Gone Red** (`alert`): sold out, and every error the backend actually reported. `alert-surface` / `critical-edge` complete it. Used for failure, never for a customer's own cancellation.

### Tertiary

- **Ledger Blue** (`info`): money settled — the PAID status, and nothing else so far. `info-surface` / `info-edge` complete it.

### Neutral

- **Printed Ink** (`ink`): the printed figure and every primary line of text (13:1 on a flap). It is near-white, which is why a primary button's label is `board`, not white.
- **Ink Muted** (`ink-muted`): secondary but still read — inline figures in counts and pagination, a secondary button's label (8.4:1).
- **Ink Subtle** (`ink-subtle`): rails, column headers, supporting sentences (5.8:1).
- **Ink Faint** (`ink-faint`): placeholder text and a disabled control's label (4.9:1 — the floor, and it is text a person is still expected to read).
- **Chassis Hairline** (`hairline`): the 1px gap between flaps, and every divider and panel border in the system.
- **Interactive Edge** (`edge`): the border on things you can interact with — inputs, secondary buttons, the dashed empty-state frame, the scrollbar thumb.

### Named Rules

**The Reserved Amber Rule.** Amber marks something that is currently changing and nothing else: a live figure, focus, selection, the caret, the hover target. It is deliberately absent from buttons and from navigation — including the active category tab, which is marked in ink. The moment amber decorates something static, the board loses the one signal it exists to send. This is the single most important constraint in the system.

**The One Polarity Rule.** Light-on-dark, everywhere, with `color-scheme: dark` declared on `html`. There is no light mode and no `prefers-color-scheme` branch. A flap is a dark card a shade above the board; a white panel is not a variant of this world, it is a different world wearing its layout.

**The Role Names Only Rule.** Components consume the semantic names above (`text-ink-subtle`, `bg-surface`, `border-hairline`). A raw Tailwind palette class — `text-slate-500`, `bg-gray-900` — is a defect, not a shortcut: there are none in the app, and the token pass exists so the world can be re-lit by changing values rather than rewriting files.

**The Neutral Cancellation Rule.** `CANCELLED` is neutral, not critical. A customer who cancelled their own order has not hit an error, and red would tell them something is wrong every time they open their history.

## Typography

**Display / Body / Label Font:** Archivo Variable (fallback `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`) — one family, self-hosted from `@fontsource-variable/archivo/wdth.css`, carrying **both** variable axes: weight 100–900 and width 62–125.

**Character:** Archivo is drawn from the American gothics used on highway and transit signage — the same drawing tradition as a departures board's flap lettering. The width axis is the whole point: it lets condensed board lettering sit beside normal-width body copy without a second family, and it means a price can dominate a row without simply being enormous.

### Hierarchy

- **Display** (700, `clamp(2.5rem, 1.5rem + 4vw, 3.75rem)`, line-height 1, width 80, tabular): money on a detail page. The largest thing on any screen is a number.
- **Title** (700, `clamp(1.75rem, 1.2rem + 2vw, 2.25rem)`, line-height 1.1, width 82): a product name on its detail page, an auth card's heading. The only two places a heading is set large.
- **Figure** (700, 1.5rem, line-height 1.1, width 80, tabular, tracking −0.01em): money in a list. Right-aligned in its own fixed column.
- **Row** (700, 1.125rem, line-height 1.25, width 82): a product name on its flap, the printed stock count, an empty state's headline, the wordmark, and the `/products` page heading.
- **Body** (400, 1rem, line-height 1.6): the reading floor — descriptions and prose, capped around 60ch when centred.
- **Meta** (400, 0.8125rem, line-height 1.45): dates, counts, category tabs, supporting sentences, input text.
- **Rail** (600, 0.6875rem, tracking 0.14em, uppercase, width 88): column headers, field labels, header navigation, small unit words beside a figure.

### Named Rules

**The Width-Before-Size Rule.** Hierarchy is carried by width as much as by size. Board voice — names, headings, figures, rails, button labels — runs condensed (`condensed` at width 82, `figures` at 80, `rail` at 88); prose runs normal width. Escalating a heading by making it condensed and heavier is preferred to making it bigger.

**The Figures Rule.** Every number a person might compare or add up gets the `figures` utility: tabular, condensed, weight 700. Prices, stock counts, category counts, "Showing 1–12 of 40". A number set in running text drifts out of its column and stops being comparable.

**The Rail-Not-Eyebrow Rule.** A set of rows is labelled by the rail above it, which is the board's own wayfinding. Nothing gets a kicker or an eyebrow line above its heading — the product's category sits *under* its name, as a tag on the item rather than a title for it, so the two facts that matter are not pushed down the flap.

**The Held-Level Rule.** Lettering carries character through width and tracking; the numbers are machine-true. Figures are tabular and rigidly aligned, never tracked for effect.

## Layout

One measure for everything signed-in: a **1024px** centred column (`max-w-5xl`) with a 1.5rem gutter and 2.5rem of vertical breathing room, used identically by the header rail and the content under it so the two stay aligned. Auth pages use a 24rem card centred in the viewport. `scrollbar-gutter: stable` on `html` keeps that card from jumping sideways when a page grows a scrollbar, and `html` carries the board colour so the world runs to the window's edges rather than stopping at the content.

The board is a **fixed column template**: `minmax(0, 1fr) 7rem 7rem 10rem` — name takes the slack, stock and price get fixed columns, the action sits last. That template is what makes the alignment real, and it is repeated verbatim in three places: the column rail, the product row, and the row skeleton. Below the `sm` breakpoint (640px) it collapses to two columns — name plus price, with stock underneath — because four columns in 375px is four columns of nothing, and the column rail hides itself there rather than labelling columns that no longer exist.

Rhythm is Tailwind's 0.25rem scale, used at a small number of steps: 1rem/1.25rem inside a board row, 1.5rem inside a panel, 1rem between columns, 1.5rem–2rem between sections. Multi-fact panels use the `hairline-grid` utility — a grid whose 1px gaps *are* the cell borders, drawn by letting the container's background show through — which on this board reads as the chassis showing between flaps.

### Named Rules

**The Same Template Rule.** A skeleton uses the row's box model and column template exactly, so the switch from loading to loaded does not reflow the board or bounce the pagination down the page. A skeleton that is merely "about the right height" is a layout shift waiting to happen.

**The Controls Stay Mounted Rule.** Filters, search and pagination render through loading and error states. Losing the controls is what turns a failed fetch into a dead end.

## Elevation & Depth

**There are no shadows in this system — zero `box-shadow` declarations in the entire app, by intent.** A departures board is a matte mechanism; a drop shadow would make its flaps into floating cards. Depth is carried two ways: three close steps of dark (`board` → `surface` → `surface-muted`), and the 1px `hairline`. The header sits *below* the flaps in lightness rather than above them, so it reads as the chassis the board is mounted in.

State is signalled by tonal change, not by lift: a row lightens to `surface-muted` on hover, a sold-out row drops back to `board`, a refreshing list dims to 60% opacity, an unprinted flap fills with `skeleton`.

### Named Rules

**The Hairline Rule.** Separation is a 1px line in `hairline` — a divider, a panel border, or the gap in a `hairline-grid`. Never a shadow, never a gap alone, never a heavier rule.

**The Tonal-State Rule.** Interactive state is a step on the dark ramp or an opacity change. If a state needs to be more visible than that, it needs a border colour, not elevation.

## Shapes

Two radii, both small, both named for their job: **control** (0.375rem) on anything a person operates — buttons, inputs, badges, tabs, notices — and **panel** (0.5rem) on anything printed — flaps, hairline grids, empty states. Nothing in the system is more rounded than 0.5rem, and nothing is square-cornered either.

The recurring silhouette is the **printed cell**: a small rectangle with tracked uppercase text, 0.125rem/0.5rem of padding, a transparent border that a tone fills in. That is what the `badge` utility is. Capsules are not part of this world — `rounded-full` pills were the loudest shapes on the first viewport before the board existed, and they were generic chip vocabulary belonging to no part of it.

Borders do specific work: solid `edge` means operable, solid `hairline` means structural, **dashed** `edge` means "nothing here yet" (the empty state's frame is the only dashed line in the system), and a 2px bottom rule in `ink` marks the active navigation tab. Icons are drawn paths at a single 1.75 stroke weight in a 16px box, sized `1em` and inheriting `currentColor`, so a control's colour and scale carry into them without a prop.

### Named Rules

**The Printed Cell Rule.** State and status render as a printed cell, never a capsule. If a shape needs `rounded-full`, it is either a spinner or it is wrong.

**The Drawn Stroke Rule.** Icons are drawn SVG paths at stroke 1.75, never unicode glyphs standing in for icons. A glyph borrows whatever the text face draws at whatever weight surrounds it, which is why a `−`/`+` stepper never matches itself optically. The one exception is `×` between a price and a quantity: that is a real multiplication sign doing typographic work.

## Components

### Buttons

One component, four variants, three sizes — and a `buttonClass()` function kept in its own module so the roughly half of these that navigate can render as `<Link>` and still look identical.

- **Shape:** control radius (0.375rem). Condensed, semibold, tracking 0.03em — on this board every control is a printed label, one step wider than the rails.
- **Primary:** a printed flap — near-white `ink` fill with a `board` label (never `text-white`: on this inverted palette the fill *is* near-white). Hover goes to pure white. Disabled is a filled-but-inert `surface-muted` with an `ink-faint` label, not a faded ghost, because the label carries the reason ("Out of stock") and has to stay readable.
- **Secondary (the default):** `edge` border on a `surface` fill with an `ink-muted` label; hover brightens border, fill and text together. Disabled drops to 40% opacity.
- **Danger:** `critical-edge` border on `critical-surface` with a `critical` label. Used for the retry inside an error banner, so it reads as part of the error rather than a second alarm.
- **On-color:** for a control sitting on an already-tinted notice. It borrows the panel's own colour through `currentColor` and fills with `board/40`, so one definition works on the red and the amber notices alike.
- **Focus:** a 2px amber outline at 2px offset, via the `focus-ring` utility, on every single control — including the header's log-out button, which had lost its ring before the button was consolidated.
- **Sizes:** `md` (min-height 2.75rem) clears the 44px touch target and is the default; `sm` (0.375rem/0.75rem) is for pointer-dense chrome only — pagination, the header; `icon` is a 2rem square for the quantity stepper.

### Badges

- **Style:** the printed cell — control radius, transparent border filled in by tone, 0.6875rem uppercase at 0.06em tracking.
- **Tones:** `neutral` (hairline border, `surface-muted` fill, `ink-subtle` text), `positive`, `caution`, `critical`, `info` — each a matched border/surface/text triple from its colour family.
- **Mapping:** order status uses caution → info → positive → neutral for PENDING → PAID → SHIPPED → CANCELLED, keyed off the backend enum so a new status is a type error rather than an unstyled cell. Stock does *not* use a badge (see below).

### Cards / Containers

- **Flap (`surface` utility):** hairline border, panel radius, `surface` fill, no shadow. 1.5rem of padding, 2rem on a wide detail page. This is the only container primitive.
- **Hairline grid:** for sets of labelled facts — a grid with 1px gaps over a `hairline` background, so the gaps read as the chassis between flaps. One or two columns.
- **Empty state:** dashed `edge` frame on `surface`, generous 3.5rem vertical padding, a condensed row-scale headline, a body-scale sentence capped at 60ch, and an action. Deliberately not styled like an error — an empty result is not a failure.
- **Error banner:** control radius, `critical-edge` border on `critical-surface`, meta-scale `critical` text, `role="alert"`. It renders what the backend actually said (one message plain, several as a list) and carries its own retry button.

### Inputs / Fields

- **Style:** `edge` border on a `board` fill — inputs are cut *into* the board rather than sitting on it — control radius, meta-scale `ink` text, `ink-faint` placeholder.
- **Label:** a rail above the field. Field labels and column headers are the same voice.
- **Focus:** the amber `focus-ring`. The caret is amber too, and `::selection` is amber-on-board.
- **Error:** border switches to `critical` *and* a meta-scale `critical` message renders below, wired through `aria-describedby`. Colour is never the only signal.

### Navigation

- **Header rail:** a `board` bar with one `hairline` beneath it, holding the wordmark left and identity/cart/log-out right. The wordmark is set in row-scale condensed caps at 0.16em tracking — the operator's name in the same lettering as the destinations — and is the one navigation element that turns amber on hover.
- **Secondary links:** rail-scale, `ink-subtle`, brightening to `ink` on hover.
- **Category tabs:** a hairline tab strip, not a row of capsules. Meta-scale condensed labels sitting on a shared bottom hairline, each with its product count set as a figure at 70% opacity; the active tab is marked by a 2px `ink` bottom rule and `ink` text. Inactive tabs reveal an `edge` rule on hover. **Never amber** — this is navigation, not a live figure.

### Board Row (signature)

The catalog's central component and the reason the system exists. One flap per product: a grid on the fixed column template, name in condensed 700 (line-clamped to two lines) with its category as a rail underneath and a truncated description below that, price right-aligned in figure-scale tabular figures, the stock cell, and the add control last. Hover lifts the whole flap to `surface-muted` and turns the name amber; a sold-out flap drops to `board`, because a row has fallen blank. The entire tile is clickable through a stretched pseudo-element on the title link rather than a wrapping `<a>`, with the add control lifted above that overlay on its own stacking context. Rows are separated by the chassis hairline inside a `surface` list.

### Stock Cell (signature)

Stock is a **printed figure**, not a badge — the correction that made the thesis land, since a word in a grey capsule is exactly what a departures board is not. The count is always printed, in tabular figures at row scale, with a rail-scale unit word beside it:

- **Settled** — `signal` green: the flap has stopped turning.
- **Low** (5 or fewer) — `amber`: the board's reserved colour for a figure that can still change.
- **Gone** — `critical` red, wrapped in `<s>`, with no figure to print: this is information that is no longer accurate, and `<s>` is the honest element for that.

The count and its unit are announced as one sentence through `aria-label` while both visible parts are `aria-hidden`, so a screen reader hears "Only 2 left" and sighted users read the column.

**The Turn** — the system's *only* authored motion. When the count changes between renders, the figure rotates once on its horizontal axle: `perspective(240px) rotateX(0 → −72deg → 0)` over 400ms on `cubic-bezier(0.16, 1, 0.3, 1)`, a strong exponential out so a mechanical part reads as having mass and settling rather than gliding. It starts and ends fully visible — the movement is the information, never a fade from nothing — and it never fires on first paint, so a page load does not flip every figure on the board at once. Everything else that moves is stock loading feedback (`animate-pulse` skeletons, one spinner, an opacity dim on a refreshing list) plus Tailwind's default transition on hover and focus. **A general motion vocabulary does not exist in this system; do not invent one.**

### Pagination

A `hairline` top rule, prev/next as `sm` secondary buttons disabled at the boundaries (never clamped after the fact), a rail-scale "Page 2 of 5" between them, and a meta-scale "Showing 1–12 of 40" with each number set as a figure. Shared by the catalog and the order history rather than duplicated.

## Do's and Don'ts

### Do:

- **Do** consume the semantic role names — `ink`, `ink-muted`, `ink-subtle`, `ink-faint`, `board`, `surface`, `surface-muted`, `surface-sunken`, `hairline`, `edge`, `skeleton`, `amber`, `signal`, `alert`, the `critical` / `caution` / `positive` / `info` families, and `focus`.
- **Do** reach for the existing utilities before writing classes: `surface`, `hairline-grid`, `rail`, `figures`, `condensed`, `focus-ring`, `badge`, `animate-flap-turn`.
- **Do** set every comparable number with `figures`, and give it a fixed column when it sits in a list.
- **Do** route every control through `Button` / `buttonClass()`, and use `buttonClass()` on a `<Link>` when the control navigates so middle-click and "copy link address" keep working.
- **Do** use `md` (44px) for any action a thumb has to hit; reserve `sm` for pointer-dense chrome.
- **Do** name what a count counts — "40 products", never a bare "40".
- **Do** give a failure the specific thing the backend said plus the next action, and put the retry inside `ErrorBanner` where it belongs.
- **Do** keep type-role names (`--text-*`) and colour names (`--color-*`) disjoint: Tailwind generates `text-<name>` from both namespaces, so a `--text-board` beside a `--color-board` would collide on one utility.
- **Do** reduce motion rather than delete it under `prefers-reduced-motion` — the skeleton's pulse is information, so the opacity change still lands, it just stops repeating.

### Don't:

- **Don't** spend amber on anything static. Not a button, not a heading, not an active nav marker, not a decorative rule. It means "this can still change."
- **Don't** introduce a light surface or a light mode. One polarity; a flap is a dark card a shade above the board.
- **Don't** write a raw Tailwind palette class (`text-slate-500`, `bg-gray-800`, `text-white`). On this inverted palette `bg-ink` already *is* near-white.
- **Don't** add a `box-shadow`. Depth is three steps of dark and a 1px hairline; there are none in the app and there should stay none.
- **Don't** use `rounded-full` for state, status or counts — the printed cell is the shape. A spinner is the only legitimate circle.
- **Don't** build a product card with an image slot. There is no photography and no schema column for any; a row that admits it and gets denser is the design, not a stopgap.
- **Don't** put an eyebrow or kicker above a heading. The rail above a set of rows is the label; a product's category goes under its name.
- **Don't** stand a unicode glyph in for an icon. Drawn paths at stroke 1.75, inheriting `currentColor`.
- **Don't** author a second bespoke animation. The flap turn is the one authored moment and its scarcity is what makes it read as the board moving.
- **Don't** render a heading larger than the figures on the same screen. The visitor came to read the number, not the name of a database table.
- **Don't** signal an error state with colour alone — a border change always comes with a message.
- **Don't** offer a one-click retry on checkout. `POST /api/orders` has no idempotency key, so a retry of a request that actually succeeded places a second order.

## Open

Recorded as open, not as system rules. A future pass should resolve these rather than inherit them.

- **Named-forward ceiling work, not yet built.** No flap carries the horizontal seam that most identifies the medium; figures are set as text rather than in character cells; the board is a 1024px centred panel rather than something read across the window. These are the three moves that would take the world from convincing to unmistakable.
- **Two `rounded-full` count bubbles survive** the printed-cell rule — the header cart count and the Admin marker on `/account`. They contradict **The Printed Cell Rule** above; the rule is correct and these are the drift.
- **`/account` is behind the rest of the system.** Its two `<dt>` labels hand-roll the rail's properties instead of using the `rail` utility, and its Admin marker is a pill where `AppLayout` uses a proper badge.
- **Touch target on the board's add control.** It renders at `sm` (~30px) inside a tile whose title link covers everything, so a mis-tap navigates away. Raising it needs real separation from that overlay plus an announcement for the successful add, so it was left for a dedicated pass.
- **Copy is untouched by this pass.** The catalog's `<h1>` is still "Products", the detail page prints "Product ID", and a sold-out row says "Out of stock" twice. Typography records how these are set, not what they say.
- **Seed data contradicts its own labels** ("Desk Lamp" filed under BOOKS & MEDIA, "The Pragmatic Programmer" under ELECTRONICS) and a developer note ships as product copy. This is a database change and awaits the user's decision.
- **"Commerce" is a placeholder wordmark.** Its type treatment — row-scale condensed caps at 0.16em — is a real decision and survives a rename; the word does not.
- **No automated tests exist in `frontend/`.** Nothing asserts that any rule above still holds; `npm run lint` and `tsc -b` are the only gates.
