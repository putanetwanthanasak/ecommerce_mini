# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the shopper.** A signed-in customer browsing a catalog, filtering it down, putting things in a cart and placing an order — then coming back to check what they ordered and what it cost. Confirmed: this is being built for real shoppers eventually, not as a demo of a shopper. Design decisions assume real customers, real catalog, real money, even while the data behind them is still placeholder.

**Second, real but unserved: the store operator.** Products, stock levels, categories and order statuses all have to be created and moved by someone. Today that someone uses Prisma Studio — there is no admin interface, and `ADMIN` role holders are promoted directly in the database. The role exists in the schema and is enforced by the API (`requireAdmin`), so this is a real user class with no surface yet, not a hypothetical one.

## Product Purpose

An online store: find a product, buy it, and have a truthful record of what you bought. Success is a shopper completing a purchase and trusting the result — the price they saw is the price they were charged, the stock they were promised was actually reserved for them, and their order history says the same thing a month later.

The project began as a backend engineering exercise and that origin still shows in the README and in the depth of the API, but the stated destination is a store real people use.

## Positioning

The integrity of the transaction is the product's actual differentiator, and it is real rather than claimed — it is enforced in code and covered by tests:

- Stock cannot be oversold under concurrency. The stock condition lives inside the write (`updateMany` with a `stock >= quantity` guard), not in a check before it, and there is a test that fires two simultaneous orders at a stock of 1 and asserts exactly one 201 and one 409.
- Multi-row writes lock in a globally consistent order, so concurrent overlapping orders don't deadlock. Measured: 40 concurrent two-item orders, 40 succeeded with the sort, 8 succeeded without it.
- Price is never accepted from the client. The order transaction reads price off the product row, and money is computed in `Prisma.Decimal`, never floats.
- Order history is immutable in the way that matters: `priceAtPurchase` is copied at purchase time, so a repriced product does not rewrite what a customer was charged.

A neighboring store built on the same stack could copy the feature list. It could not truthfully copy these, and the surfaces should not be designed as if the guarantees were decorative.

## Operating Context

- Web app in a browser, desktop and mobile, on a real network. Currently localhost only, not deployed.
- Two apps, run separately: an Express + Prisma API on `:4000` and a Vite SPA on `:5173`. The frontend needs `VITE_API_URL` or it will not boot.
- The shopper's session is a 1-day JWT held in `localStorage`; it can expire mid-flow, and the cart is deliberately built to survive that.
- The catalog is currently behind the auth gate — even browsing requires an account. This is a known deviation from how shoppers actually behave and is recorded as an open decision below, not as a settled design.
- The cart has no server side at all. It lives in React context, persists to `localStorage` under its own key, and is submitted as one payload at checkout.

## Capabilities and Constraints

**Shipped and working:** register / login / logout; a paginated product catalog with debounced search and category filter, all held in the URL; product detail; a client-side cart; checkout that places an order; a paginated order history and a single-order view that doubles as the post-checkout confirmation. Backend has full auth, category, product and order routes with 21 Vitest/Supertest tests and CI on every push.

**Domain terminology (from the schema — use these words, not synonyms):** `Role` is `CUSTOMER` or `ADMIN`. `OrderStatus` is `PENDING`, `PAID`, `SHIPPED`, or `CANCELLED`. An order has `totalPrice`; a line has `quantity` and `priceAtPurchase`. A product has `name`, `description` (optional), `price`, `stock`, and a required `categoryId`.

**Constraints future work must not break:**

- **There is no image column on `Product`.** The schema carries name, description, price, stock, category — nothing else. Any surface that wants product photography is asking for a migration and a place to host files, not a CSS change. Until then the catalog has to look deliberate without pictures.
- `price` arrives from the API as a JSON string with trailing zeros dropped (`38.00` → `"38"`). It is not display-ready. One module owns the conversion.
- `POST /api/orders` accepts `{ productId, quantity }` and nothing else. No `price`, no `totalPrice`, ever.
- There is no idempotency key on order creation. Two identical concurrent POSTs create two orders. Only the client's in-flight guard prevents that, so no surface may offer a one-click retry of a checkout.
- 401 and 403 mean different things and must stay different: 401 clears the session, 403 never does.
- Anything displayed about a past order comes from the order, never from today's product row.
- The full list of these lives in `CLAUDE.md` as numbered backend and frontend invariants. That file is authoritative on them; this one only records that they are product-level commitments rather than incidental code style.

**Open — not decided, do not assume either way:**

- Whether the catalog becomes publicly browsable before sign-in.
- Whether a payment step is added between cart and confirmation. Today checkout places an order with no payment at all, and `PAID` is a status nothing sets from the UI.
- Whether admin/operator screens get built, and if so how much of the operator's job they cover.
- Whether and where this deploys.
- Status transition rules beyond cancel. `SHIPPED → PENDING` is currently legal.

## Brand Commitments

**None yet, and nothing existing is binding.** The header wordmark currently reads "Commerce" and is confirmed to be a placeholder — the store has no real name, voice, logo, or personality, and future work is free to establish one. The current look (Tailwind slate defaults, Inter, one 5xl container) is an unexamined default rather than a decision anyone made, so it carries no authority as an incumbent identity.

No legal, licensing, or attribution constraints exist.

## Evidence on Hand

**Nothing real.** Product names, descriptions, prices and categories are placeholder seed rows. There are no product images anywhere in the project and no schema column to hold one. There are no customers, no reviews, no ratings, no testimonials, no press, no benchmarks, no case studies, no pricing tiers, and no company.

Future work must not fabricate any of it — no invented brand names on products, no stock photography presented as the catalog, no "trusted by" row, no review stars, no fake social proof. The engineering claims in **Positioning** are the exception: those are real, verifiable in the test suite, and may be stated.

Real assets that do exist: the API and its 21-test suite, CI badge in `README.md`, and `backend/CODE_GUIDE.md`.

## Product Principles

1. **The transaction's honesty is the feature.** Every surface that touches money, stock, or order history is held to what the backend actually guarantees. Never display a number the system cannot stand behind, and never imply a reservation, a payment, or an availability the API did not make.
2. **Stale reads are shown, not silently corrected.** A cart's stored stock can be days old. The design surfaces the shortage and lets the shopper decide; it never rewrites their quantity behind their back to make a screen look clean.
3. **Every failure names the next action.** Out of stock names the product and offers the fix. Removed product names the line to drop. Expired session says the cart is safe. A raw error string that leaves someone re-clicking a doomed button is a design defect, not a backend one.
4. **Design around the absence of imagery, not in spite of it.** With no product photos and no column to hold them, a catalog that leans on pictures is a catalog full of grey rectangles. Typography, structure, price and stock have to carry it — and should look chosen, not deprived.
5. **Don't dress it as a company it isn't.** No fabricated proof, no invented customers, no fictional brand history. The credibility available here is the real kind: precision, correct behavior under stress, and copy that tells the truth.

## Accessibility & Inclusion

No formal standard has been established and no specific user needs were recorded. Treated as an open question rather than an answered one — with the working assumption that a store handling money holds keyboard operability, visible focus, contrast, and honest semantics to a high bar regardless of whether an audit demands it.
