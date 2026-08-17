# Critique snapshots — historical, not current

Every file in this directory is a **dated snapshot taken before the fix**, not a
description of how the UI reads today. They are kept because the reasoning behind
the redesign is worth having in the repo; a diff shows what changed, not why it
was worth changing.

Read the `timestamp` in each file's frontmatter and compare it against the git
history before believing any score in it.

The notes are deliberately left byte-identical to what the tool generated — the
frontmatter is machine-read (`critique-storage.mjs` parses it with a regex
anchored to the first line, and the polish workflow loads the newest matching
snapshot as its fix backlog), so nothing is prepended to the reports themselves.
That is why this note is a separate file.

## `2026-08-17T09-26-21Z__frontend-src-pages-productlistpage-tsx.md`

Scores `/products` at **24/40**. Taken on 2026-08-17, hours before commit
`1469778` ("Give the frontend a real design system") on `chore/ui-design-system`
— so it describes the catalog as it looked *without* the design system.

It is a **source-only read**: the critique says so itself, and it matters. Neither
assessment ever saw the page rendered — `/products` is behind the auth gate, the
browser tooling was denied, and the run declined to forge a session token. Roughly
41 of the detector's 59 rules need computed styles from a live page and never ran.
Its "zero findings" from the deterministic scan means "no textual anti-patterns",
not "renders correctly".

### What commit `1469778` fixed

One of the four priority issues, the third:

> **[P1] No visual hierarchy, and the project's only design token does not ship**

That one is resolved. Inter was named in `index.css` and never actually loaded —
no `@font-face`, no link tag, no package — so the single recorded aesthetic
decision silently did nothing and the app rendered in Segoe UI. It is now Archivo,
self-hosted via `@fontsource-variable/archivo` with both variable axes, behind a
real `@theme` layer. The `ACTION_BUTTON` string the critique found copy-pasted
into six files is down to zero copies, replaced by `components/buttonStyles.ts`
and `components/Button.tsx`.

### What is still open

The other three are untouched by that commit and remain accurate as of this note:

- **[P0] The catalog sits behind the auth gate.** A shopper must register before
  seeing a single product, even though `GET /api/products` and `/api/products/:id`
  carry no `requireAuth` and are already public. Still `App.tsx:42`, inside
  `ProtectedRoute`.
- **[P1] Adding to cart is unconfirmed and the tap target is hostile.** Still
  `size="sm"` inside a card whose title link stretches `after:inset-0` across the
  whole tile, so a mis-tap navigates away and discards filters. No `aria-live`
  acknowledgement.
- **[P1] The return path from a product destroys catalog state.** Still a bare
  `Link to="/products"` (`ProductDetailPage.tsx:143`) with no query string, so
  page, search and category are dropped on every round trip of the comparison
  loop. No `ScrollRestoration`.

The critique's closing questions — whether a catalog with no photography should
let typography carry the composition, and whether "reserve now, pay on delivery"
should be said out loud rather than left as the system's most confusing
undocumented property — are still open design questions, not resolved ones.
