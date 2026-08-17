---
target: /products
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-17T09-26-21Z
slug: frontend-src-pages-productlistpage-tsx
---
Method: dual-agent (A: design review from source, isolated / B: deterministic detector + bounded browser attempt, isolated). Neither saw the other's output. No degradation.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 350ms debounce window has zero indicator; no live region announces new result count after search settles. |
| 2 | Match System / Real World | 2 | h1 is "Products" (a table name). "Units in stock", mono UUID as "Product ID", empty state names the internal ADMIN role. |
| 3 | User Control and Freedom | 2 | ProductDetailPage.tsx:121 bare Link to="/products" destroys page/search/category. No ScrollRestoration. |
| 4 | Consistency and Standards | 3 | ACTION_BUTTON duplicated across SIX files; Cart link and Log out are visually identical pills 12px apart. |
| 5 | Error Prevention | 3 | Strong param clamping and doomed-basket prevention, but ?categoryId=garbage is an unrecoverable 400 and one-tap Log out has no confirmation. |
| 6 | Recognition Rather Than Recall | 3 | Filters visible and URL-backed, but on mobile search/pills/count all scroll off above a one-column grid. |
| 7 | Flexibility and Efficiency | 2 | No sort control; products.ts:78 hardcodes orderBy createdAt desc. No page jump, no keyboard accelerators. |
| 8 | Aesthetic and Minimalist Design | 2 | Minimal by default, not by decision. Nothing extraneous, nothing chosen. |
| 9 | Error Recovery | 3 | Four-way empty state is best-in-class; marked down because the filtered empty state misdiagnoses its own cause (backend matches name only). |
| 10 | Help and Documentation | 1 | None. Checkout takes no payment and creates a PENDING order that decrements real stock; nothing says so. |
| **Total** | | **24/40** | **Acceptable - significant improvements needed** |

Lowered Assessment A's Error Prevention from 4 to 3 (unconfirmed one-tap Log out styled identically to adjacent Cart link; unvalidated categoryId renders a retry that can never succeed). Total 25 -> 24.

## Design Specificity Verdict

CATEGORY-GENERIC. An unrelated product could ship this composition unchanged without editing a single class string. The interaction model is specific and well-engineered; the design was never authored.

Verified evidence:
- frontend/src/index.css is 14 lines with exactly one token, --font-sans: "Inter", and Inter is NEVER LOADED. No @font-face, no link tag in frontend/index.html, no font package in package.json. Renders as Segoe UI on most Windows/Android. The only recorded aesthetic decision does not take effect.
- ACTION_BUTTON copy-pasted into SIX files: ProductListPage, ProductDetailPage, OrderListPage, OrderDetailPage, CheckoutPage, CartPage. (Assessment A found three.)
- The h1 is "Products" - a database table name on a store's front page.
- Wordmark is text-xs text-slate-400 uppercase: identity at 12px in the third-lightest grey, quieter than every stock badge. The slot itself is designed to be invisible.
- Price is the only real content and is typeset as metadata: name text-base/medium vs price text-lg/semibold, both losing to the h1.
- StockBadge is the only non-slate colour and the only element with product character; it is 12px in a card's bottom-right corner.
- The best sentence in the frontend ("Prices are confirmed by the server when you place the order") is 12px grey on the CART page and absent from the catalog.

Deterministic scan: detect.mjs --json frontend/src -> exit 0, ZERO findings, confirmed on narrowed scopes. Critical caveat: the registry defines 59 rules but only ~18 run against source text. The other ~41 (low-contrast, tiny-text, cramped-padding, text-overflow, heading-rhythm, edge-flush-cards, etc.) require computed styles from a rendered page and NEVER RAN. Clean means "no textual anti-patterns", not "renders correctly". Real signal: flat-type-hierarchy and monotonous-spacing do parse Tailwind size classes, had a genuine chance to fire, and did not. Engine validated against a deliberately bad control file (fired bounce-easing correctly); no config suppression present.

Tension worth recording: the detector says type hierarchy is fine; both human-judgment reads call it the page's central weakness. The detector checks whether distinct sizes exist (they do). What is wrong is which content got which size - no regex sees that a store put its largest type on the word "Products".

Visual overlays: NONE. No user-visible overlay exists and the in-page detector never ran. Both dev servers came up and the backend/Supabase are live (GET /api/products returned real rows: Desk Lamp "38", a stock:0 keyboard). But /products is gated client-side so a tokenless load redirects to /login; Chrome MCP tools were denied by the permission classifier on two attempts; the headless fallback needs puppeteer, not installed. Assessment B declined to forge a session token or install dependencies. THIS CRITIQUE IS A SOURCE-ONLY READ OF A PAGE NEITHER ASSESSMENT SAW RENDERED.

## Overall Impression

Unusually well-engineered frontend code wearing no design at all. The state layer beats most production catalogs: URL genuinely the single source of truth, working bidirectional debounce sync, four distinct empty states. Then it renders twelve identical white rectangles under the word "Products" in Tailwind's default greys.

Biggest opportunity is the apparent biggest constraint: no product photography and no schema column for it. A catalog that cannot lean on images must make price, name, category and stock truthfulness carry the composition - an unusual brief that could produce a distinctive store. Currently the absence produces an admin table.

## What's Working

1. The four-way empty state (ProductListPage.tsx:78-119). Distinguishes empty catalog / no filter matches / past the last page, each with its own diagnosis AND escape hatch. "Page 5 is past the end / 12 matching products across 1 page / [Back to page 1]" is a state most teams never notice exists. It works because it tells the user WHICH zero they are in.

2. URL-as-truth with working bidirectional sync (useCatalogParams.ts + the syncedSearch ref). Naive debounced-URL implementations resolve the echo by cutting one direction, breaking Back or refresh. The ref lets each effect recognise its own write returning, so both survive. With readPositiveInt and empty-param deletion, hand-edited URLs essentially cannot produce a broken state.

3. keepPreviousData paired with a skeleton sharing the card's box model. Page changes dim rather than empty the grid; skeleton matches padding, h-full flex-col and bottom-pinned price row, so loading->loaded does not reflow pagination out from under a cursor mid-click.

## Priority Issues

### [P0] Catalog is behind the auth gate; a shopper must register before seeing a single product

Verified: GET /api/products and GET /api/products/:id carry NO requireAuth. Both endpoints are already public; the wall is purely a frontend convenience (App.tsx:41), existing so header/log-out/401 need only one rule set. PRODUCT.md names the real shopper as primary user, and the primary task (find a product) is unreachable without an account. Blocks task one for every new visitor.

Fix: Move /products and /products/:id outside ProtectedRoute; keep /cart, /checkout, /orders* inside. AppLayout grows a signed-out branch (wordmark + Cart + Sign in). Catalog reads pass auth:false so an expired token during public browsing does not fire the session-clear (frontend invariant 1 intact: apiRequest only calls onUnauthorized when a token was attached). Cart already survives sign-out, so add-then-sign-in needs no new state.

Suggested command: /impeccable shape

### [P1] Adding to cart is unconfirmed, and the tap target is hostile

AddToCartButton at size="sm" is ~30px tall inside a card whose title link stretches after:absolute after:inset-0 over the whole tile. A sub-44px target inside a full-tile navigation overlay means a mis-tap NAVIGATES AWAY, and the back link then discards filters. Success feedback is a label change to "Add another", a 12px "N in cart" note, and a badge increment in a header already scrolled past. Nothing announced to AT. This is how double-adds happen, and the backend has no idempotency key.

Fix: >=44px target with real spatial separation from the inset-0 overlay. One polite aria-live region announcing "Added - Desk Lamp, 2 in cart". Visual acknowledgement anchored to the card, not the header. Consider restricting the click overlay to the card's upper region so price/description stay selectable.

Suggested command: /impeccable adapt, then /impeccable animate

### [P1] No visual hierarchy, and the project's only design token does not ship

With no imagery and no column for it, typography is the entire visual vocabulary - and the largest text on a shopping page is the word "Products". Card name, price, eyebrow, badge and button all land in a narrow weight band, making twelve near-identical blocks a reading task rather than a looking task (~11 seconds before preference can form). The one stated aesthetic intent silently does not take effect.

Fix: Self-host Inter (@fontsource-variable/inter) or drop it and own the system stack deliberately. Real @theme layer: display/price type scale, one accent that is not slate, surface/border pair. Re-rank the card - name dominant, price at display weight with tabular-nums (formatPrice already guarantees two decimals so columns align), stock badge promoted to a hierarchy participant. Give ACTION_BUTTON one home, delete the five copies.

Suggested command: /impeccable typeset, then /impeccable extract

### [P1] The return path from a product destroys catalog state

ProductDetailPage.tsx:121 is Link to="/products" with no query string - page, search, category dropped. No ScrollRestoration, so browser-Back also lands at grid top. Comparison shopping IS the core catalog loop; this charges the filter work again every round trip. The code comment reasons the filters live in the catalog URL anyway - true, and exactly why discarding them is the bug.

Fix: Card title link carries current catalog search (state or a `from` value); back link renders as Link to={from ?? "/products"}; add ScrollRestoration. Keep the plain fallback for shared-URL arrivals.

Related verified inconsistency: setSearch uses replace:true (documented, so Back is not a per-word undo) while setCategoryId pushes. Pick a category then type a search and the search OVERWRITES the category's history entry, so one Back press discards both filters at once - and since / redirects with replace, that press can exit the app. Back is a per-filter undo for categories and a nuclear exit for searches, depending on which control was touched last.

Suggested command: /impeccable harden

### [P2] No sort, and the search misdiagnoses its own failures

products.ts:78 hardcodes orderBy createdAt desc with no query param, so the grid including search results ranks by when an admin typed the row in. No sort-by-price, the most-requested catalog control there is. Separately products.ts:72 matches name only, while the filtered empty state advises "Try a shorter search, or a different category" - so a shopper searching a description word is told to fix the wrong thing.

Fix: Add ?sort= to the backend list schema (newest | price_asc | price_desc | name), surface it beside the search field, carry it in useCatalogParams so it resets page like every other filter. Then either extend the backend where to OR across name and description, or make the copy state the real rule: "Search matches product names. Nothing is named X."

Suggested command: /impeccable clarify for the copy; sort control is ordinary feature work

## Persona Red Flags

Casey (distracted mobile, one thumb, interrupted, slow connection):
- Types "keyb", sees nothing for 350ms - no field spinner, no "searching...". Real gap is 600-900ms and the only signal is the grid fading to opacity-60 at the END. She retypes.
- Mis-taps the ~30px add button, hits the inset-0 title overlay, lands on the detail page, taps back, loses search and page. Two taps to undo one mis-tap, ending further from the goal.
- Successful add is invisible: by card three the header and CartBadge are scrolled away, leaving 12px grey text on the button she mis-aimed at. She taps again.
- Cart and Log out are the same object: visually identical bordered slate pills, gap-3 apart, Log out unconfirmed. Verified difference is worse than reported - CartBadge has outline-none focus-visible:ring-2 focus-visible:ring-slate-300 and Log out has NO focus-visible ring, so the destructive control is the one a keyboard user cannot see focus on.
- refetchOnWindowFocus:false means she returns to stale stock: "Only 2 left" from ten minutes ago still reads that when real stock is 0.

Riley (deliberate stress tester):
- Refresh mid-flow is the best behaviour on the surface: ?page=3&search=mug&categoryId=... restores exactly.
- Back button breaks in ten seconds via the push/replace asymmetry above.
- Two tabs silently lose cart data. CartProvider reads loadCart() once at mount and persists on change; verified there is NO addEventListener anywhere in the frontend, so no storage listener. Two tabs hold divergent carts, both write the same key, last write wins, loser's adds vanish on its next mutation.
- Long names: line-clamp-2 with no title attribute, so products differing after char 80 are visually identical while the link's accessible name is the full string - sighted and screen-reader users see different things. No break-words, so one 60-char unbroken token overflows the tile. The detail page guards this (break-all on the UUID); the grid card did not get the same treatment.
- 1000 products: 84 pages behind Prev/Next only, no jump, no sort - product 900 is 83 clicks. ?limit=100 works but is undiscoverable.
- ?categoryId=garbage is the one hole in an otherwise airtight param layer: not UUID-validated client-side, renders a red ErrorBanner with a retry that can never succeed.

Jordan (first-timer):
- Cannot get in. A registration form is the first and only thing shown - zero products, zero prices, no evidence the store is real.
- Nothing says what is sold: 12px grey wordmark, h1 "Products", no landing page, no category overview, no framing sentence.
- "Out of stock" appears TWICE on one card: red StockBadge, and 12px below it a disabled button with the same string. He reads the second as a broken control.
- Does not know what he is committing to. Checkout takes no payment; the order is created PENDING and real stock is decremented. Nothing on catalog, card or cart says so. A consent gap on the surface that starts the flow.

The Photo-less Shopper (project-specific, derived from PRODUCT.md; no ## Design Context exists in CLAUDE.md): deciding whether to trust a store that shows no pictures, with only names, prices and stock to judge by, and no reviews or ratings that may be fabricated. Red flags: nothing explains WHY there are no images, so the store reads as unfinished rather than deliberate; the one trust-earning sentence the product owns lives on a later page in 12px grey; the store's own name is the least visible text on screen. Everything that could substitute for photography - typographic confidence, real scarcity data, explicit price-integrity claims - is absent or whispered.

## Minor Observations

- ProductListPage.tsx:170 renders "12 products matching" - a sentence that stops mid-thought.
- Result changes never announced. Skeleton has role="status" aria-live="polite" for first load only; aria-busy on a plain div is largely ignored by AT.
- No skip link; the header's five controls precede the grid on every page.
- document.title is the static "Commerce" from index.html (verified) - every route shares it.
- aria-current="page" sits on a span reading "Page 2 of 5"; belongs on the element representing the current item.
- Category pills have no role="group" or group label - seven unlabelled toggles with no sign they are one filter.
- "Clear filters" mounts conditionally, shoving the grid down ~52px on apply and yanking it back on clear.
- Skeleton count is Math.min(params.limit, DEFAULT_PAGE_SIZE), so ?limit=100 renders 12 skeletons then 100 cards.
- formatPrice's em-dash fallback is a good instinct but a bare em-dash on the grid explains nothing to a shopper.
- The cart page's "Prices are confirmed by the server" line is the best sentence in the frontend, on the wrong page at the wrong size.

## Questions to Consider

1. If there will never be photography, what is the catalog's visual unit? Not "a card without an image" - that is a subtraction. What if the grid became typographic: price at display scale with tabular figures, category as a structural rail, stock state the only colour on the page?
2. The honest differentiator is that stock is genuinely reserved and price is genuinely the price. What if that were the headline instead of a footnote? "Only 2 left" is backed by a concurrency test.
3. Why must a shopper sign in to look, when the endpoints are already public?
4. What if the URL-as-truth machinery - the best-built thing here - were pointed at merchandising instead of only querying? A shareable link to "everything under $40 in Kitchen, cheapest first" is a merchandising surface; only sort and price-range are missing.
5. Checkout takes no payment and creates a PENDING order that decrements real stock. Should the catalog say so? "Reserve now, pay on delivery" would turn the most confusing property of this system into a positioning statement, and would be true.
