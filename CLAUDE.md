CLAUDE.md

Project context for Claude Code. Read this before making changes.

What this is

E-commerce mini platform. Portfolio project — the goal is code that demonstrates real backend engineering (concurrency safety, authorization, data integrity), not just working CRUD.

Status: Auth, Category, Product, and Order routes are complete and manually verified. Automated tests and CI are done — 21 Vitest/Supertest tests in backend/src/__tests__/, including the concurrent-order race, with GitHub Actions running typecheck plus the suite against an ephemeral Postgres on every push and PR, alongside a parallel job that lints and builds the frontend. The frontend covers auth (login, register, protected routing), the customer-facing catalog (a paginated product grid at /products with debounced search and category filtering, all reflected in the URL, plus a product detail page), and the buying path: a client-side cart at /cart, checkout at /checkout, and an order confirmation at /orders/:id. No order history list or admin screens yet, and no frontend tests. Not deployed anywhere.

Repository layout

This is a monorepo. Everything backend lives under backend/ — paths in this document are relative to it unless stated otherwise.

.
├── backend/          # Express + Prisma API (this document is mostly about it)
│   ├── src/
│   ├── prisma/
│   ├── package.json  # backend deps; there is no root package.json
│   ├── .env          # never committed
│   └── CODE_GUIDE.md
├── frontend/         # Vite + React + TS SPA (auth + catalog so far)
│   ├── src/
│   ├── package.json  # its own deps, its own TypeScript
│   └── .env          # VITE_API_URL, never committed
├── .github/          # CI at the root: parallel backend and frontend jobs
├── .gitignore
├── CLAUDE.md
└── README.md

There is no workspace tool (npm workspaces, Turborepo, pnpm) and no root package.json — each app installs and runs on its own. Run npm commands from inside backend/ or frontend/, never from the repo root.

The two sides do NOT share a TypeScript version. backend is pinned to 5.7 for the ts-node reason below; frontend came off the Vite template on TypeScript 6 and has its own node_modules. That is fine precisely because they are separate packages — do not try to hoist or unify them.

Stack
Layer	Choice
Runtime	Node 22, TypeScript 5.7 (both pinned — see below)
Framework	Express 5
ORM	Prisma 6 (pinned)
Database	PostgreSQL (Supabase-hosted in dev)
Validation	Zod
Auth	JWT (jsonwebtoken) + bcrypt (bcryptjs)
Tests	Vitest + Supertest (backend only)
Frontend	Vite + React 19 + TS, Tailwind 4, React Router 7, TanStack Query 5
Pinned versions — do not upgrade casually
Prisma is pinned to ^6.16.0. Prisma 7 dropped datasource { url = env(...) } in schema.prisma and requires a prisma.config.ts plus a driver adapter. Upgrading means rewriting the schema config and the client setup.
TypeScript is pinned to 5.7, @types/node to 22.10. ts-node@10.9.2 (used by ts-node-dev) crashes on the TypeScript 7 API with ts.sys undefined.

If a dependency upgrade is needed, do it deliberately as its own change, not as a side effect of something else.

Commands

All of these run from backend/, not the repo root.

bash
cd backend
npm run dev              # dev server, hot reload, NO type checking
npm run build            # tsc -p tsconfig.build.json -> dist/ (tests excluded)
npm start                # run compiled output (production)
npm test                 # vitest run
npx tsc --noEmit         # type check — run before every commit
npx prisma migrate dev   # create + apply a migration after editing schema.prisma
npx prisma studio        # browse the DB visually

And from frontend/:

bash
cd frontend
npm run dev              # Vite dev server on :5173
npm run build            # tsc -b && vite build
npm run lint             # oxlint

Local dev needs both running: the backend on :4000 and Vite on :5173, with frontend/.env pointing VITE_API_URL at the backend.

npm run dev uses --transpile-only, which skips type checking entirely. Code with type errors will run fine in dev and fail at build time. Always run npx tsc --noEmit before committing.

Architecture

All paths below are under backend/.

HTTP request
    ↓
src/index.ts        → .listen() only
src/app.ts          → the configured Express app (import this in tests)
    ↓
src/middleware/     → requireAuth, requireAdmin, errorHandler
    ↓
src/routes/         → validate, apply business rules, hit the DB, respond
    ↓
src/lib/prisma.ts   → singleton Prisma client
    ↓
PostgreSQL

src/utils/ holds jwt.ts (sign/verify) and httpError.ts (see below).

There is a detailed file-by-file walkthrough in backend/CODE_GUIDE.md. Consult it before changing anything in backend/src/routes/orders.ts.

The standard route shape

Every handler follows this. Match it.

ts
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);        // Zod validates; throws ZodError on bad input
    // business checks → early `return res.status(...)` with a specific code
    // Prisma write
    res.status(201).json({ ... });
  } catch (err) {
    next(err);                                   // everything unexpected → errorHandler
  }
});
Validation lives at the boundary. After .parse(), the data is trusted.
No route writes its own validation error response — errorHandler renders every ZodError as an identical 400.
Business rules fail fast with return, keeping the happy path un-nested.

src/routes/orders.ts is the one file that deviates, because code inside a prisma.$transaction() callback must throw, not return — see below.

Invariants — do not break these

These are the parts that took real work to get right. Changing them silently reintroduces bugs that are hard to detect and were expensive to find.

1. A check is not a lock

if (product.stock < quantity) produces a good error message. It does not make concurrent writes safe. Prisma runs READ COMMITTED by default, so two transactions can both read stock = 1, both pass the check, and both decrement.

Correctness comes from folding the condition into the write:

ts
const claimed = await tx.product.updateMany({
  where: { id: item.productId, stock: { gte: item.quantity } },
  data: { stock: { decrement: item.quantity } },
});
if (claimed.count === 0) {
  throw new HttpError(409, `Insufficient stock for ${product.name}`);
}

updateMany is used for a logically single-row update specifically because it returns a match count. Removing the where guard leaves code that looks correct and oversells under load. The same pattern guards the order status flip on the cancel path.

2. Lock rows in a globally consistent order

Every code path that updates multiple product rows sorts by productId first:

ts
const orderedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

Without it, two orders touching the same products in opposite order deadlock; Postgres kills one and the client sees a 500. Measured over 40 concurrent two-item orders: without the sort, 8 succeeded and 32 failed with deadlock errors; with it, 40 and 0.

Both POST / and the cancel path sort. If you add a third path that touches multiple product rows, it sorts too — a lock-ordering guarantee that only part of the codebase honours is not a guarantee.

3. Inside a transaction, throw — never return

return res.status(409).json(...) inside a $transaction() callback replies to the client while committing the partial writes. Only a throw rolls back. That is what src/utils/httpError.ts exists for: it carries the intended status code out to errorHandler instead of collapsing into a 500.

4. Money never comes from the client

priceAtPurchase is read off the product row inside the transaction. The request body has no price or totalPrice field and must never gain one — a client that can send a price can buy anything for a cent.

5. Money arithmetic uses Prisma.Decimal

.add() and .mul(), never + and *. JavaScript numbers are binary floats and drift by cents across a long cart. The price column is Decimal(10, 2).

6. priceAtPurchase is copied, not referenced

Order history must survive a price change. Never resolve a historical order's line total through product.price.

7. Don't delete rows that history depends on

Deleting a category with products, or a product with order items, returns 409. Check the child count before the delete rather than letting a constraint error surface.

Frontend invariants

Same idea as above: these encode decisions that are easy to undo by accident.

1. 401 and 403 are not the same failure

Handled centrally in frontend/src/lib/api.ts. A 401 on an authenticated request means the token is gone or expired, so the session is cleared and ProtectedRoute lands the user on /login. A 403 means the token is fine and the action simply isn't allowed — it must NOT sign the user out. Swapping these turns "you can't do that" into "you've been logged out", which is the most common bug in this layer.

The 401 rule is scoped to requests that actually carried a token. Login and register call apiRequest with auth: false, because a 401 there means "wrong password", not "session expired".

2. Validation errors are rendered per field

The backend returns { error: "Validation failed", details: [{ path, message }] }. ApiError.fieldErrors maps path to message so FormField can show it under the right input; ErrorBanner takes the fields a form renders and surfaces only what's left over, so nothing the backend sent is dropped and the user never just sees "Validation failed".

3. The API base URL is configuration

frontend/src/lib/api.ts reads VITE_API_URL and throws at module load if it is missing. Never hardcode a host.

4. The token is in localStorage, and that is a known exposure

frontend/src/lib/token.ts carries the full reasoning. Any injected script can read it, and a 1-day JWT cannot be revoked. It was chosen for simplicity; httpOnly cookies are the production answer. Don't quietly present it as ideal.

5. decodeToken is for UI only

It reads the role claim without verifying the signature, purely so the UI can branch on admin vs customer. Every real authorization decision is the backend's.

6. There is no role selector on register

POST /api/auth/register always creates a CUSTOMER — the backend never reads a role from the body. A selector would imply an escalation path that doesn't exist. Admins are promoted directly in the database.

7. Prices are formatted in exactly one place

price arrives as a JSON string and is not display-ready: Postgres drops trailing zeros, so 32.50 comes back as "32.5" and 38.00 as "38". frontend/src/lib/money.ts owns the only conversion — components call formatPrice(product.price) and never touch the raw value. Scattering Number() and .toFixed(2) through components is how "$32.5" ends up next to "$39.99" on the same row. When a cart arrives and money needs adding up, the arithmetic belongs here too, not in a component.

8. The cart's stored price and stock are display-only

There is no cart API. The cart lives in a React context, is persisted to localStorage, and is sent as one payload at checkout. Each line stores `name`, `price` and `stock` alongside `{ productId, quantity }` so the cart renders without a request per row — and none of those three fields prove anything. `POST /api/orders` takes `{ productId, quantity }` and nothing else; the backend reads the price off its own product row inside the order transaction. A `price` or `totalPrice` field must never be added to that request body. The stored `stock` can be days old, so frontend/src/cart/useCartLines.ts re-fetches every product when the cart page mounts and shows shortages inline — it does not silently rewrite quantities, because that changes the user's order behind their back and makes it look like they chose the smaller number. A 404'd line blocks checkout; a shortage does not, since that number is a read that can go stale and the backend's `stock >= quantity` guard is the only real decision.

9. The cart is NOT cleared when the session ends

frontend/src/cart/cartStorage.ts persists it under its own key and nothing in the auth path touches it. That is what makes a token expiring mid-checkout survivable: the user is sent to /login and comes back to the cart they were buying. The tradeoff — a shared browser hands the next person the previous cart — is acceptable only while the cart holds nothing private. If it ever gains an address or a payment detail, it must be namespaced per user or dropped on logout.

10. Every checkout failure names its next action

frontend/src/orders/checkoutError.ts classifies the ApiError into what the user has to do: 409 names the product that ran out (and the live stock is re-fetched so the fix can be "reduce to 1"), 404 carries the product id so that line can be removed, 400 renders the `details[]` messages mapped back to product names rather than a bare "Validation failed", 401 says the cart is safe while the redirect to /login happens. Rendering the raw `error` string for any of these leaves the user re-clicking a button that will keep failing. The 409 match is by product name because the message carries no id — it only ever selects a row to offer a fix on, never edits one.

11. The place-order button is disabled while the request is in flight

The backend has no idempotency key: two identical concurrent POSTs create two orders and decrement stock twice — confirmed against the running API. The disabled button plus the `inFlight` ref in CheckoutPage is the only thing preventing a double-click from doing that.

12. The catalog's page, search and category live in the URL

frontend/src/catalog/useCatalogParams.ts reads them from the query string and writes changes back; there is no component state mirroring them. That is what makes a filtered view shareable, refresh-safe and back-button-correct. Two details it encodes: empty values are dropped rather than sent blank, because the backend validates search as min(1) and categoryId as a UUID, so ?search= is a 400 rather than "no filter"; and a hand-edited ?page=0 is clamped to 1 instead of being forwarded as a guaranteed 400. Any filter change resets to page 1.

13. A failed read settles into an error state, and that state carries the retry

frontend/src/main.tsx sets the policy once for every query: two retries, backoff capped at 3s, and no retry at all on a 4xx (a 401 or 403 will never come good, and retrying only hides it behind a spinner). A doomed read therefore gives up in about three seconds instead of spinning. ErrorBanner takes an optional onRetry and renders the button itself, so "what went wrong" and "try it again" are one component rather than a banner plus a hand-rolled button repeated on every page.

onRetry is deliberately omitted in two places. Login and register are retried by fixing the form and submitting it. Checkout must not offer one at all: POST /api/orders has no idempotency key, so a one-click retry of a request that actually succeeded places a second order (invariant 11).

WHY A FAILING QUERY CAN LOOK LIKE IT NEVER SETTLES — this cost a real investigation, so it is written down in main.tsx too. TanStack pauses the gap between retries while the document is hidden (focusManager.isFocused() is document.visibilityState !== "hidden"). Such a query sits at fetchStatus: "paused" with status: "pending", so isError never becomes true and the page shows its skeleton indefinitely; it resumes and settles the moment the tab is looked at. That is correct library behaviour — there is no point burning retries on a tab nobody is watching — and it is NOT to be switched off. But it means an automated check driving a background tab will watch a query stall forever and conclude the error state is unreachable. It isn't; it is waiting for focus. Reproduce error states in a visible tab, or call focusManager.setFocused(true) in the harness.

Conventions
Status codes
Code	Meaning
400	Input failed validation (every ZodError)
401	Missing / invalid / expired token
403	Valid token, but not yours (wrong role, or another customer's order)
404	Row doesn't exist
409	Collides with existing state (duplicate, blocked delete, insufficient stock)

401 vs 403 is not interchangeable: 401 means "you aren't authenticated", 403 means "you are, and you still can't."

Authorization
requireAuth proves who. requireAdmin proves role. Neither can know whether a specific row belongs to the caller — per-row ownership checks belong in the handler (see GET /api/orders/:id).
A customer's list query is pinned to their own id from the token. A ?userId= param is consulted only on the admin branch, and is ignored rather than rejected for customers — there is no code path where a customer's filter can widen their scope.
Auth responses

Login returns the same message for "no such user" and "wrong password". Don't split them — distinct messages let an attacker enumerate registered emails.

Git
Branch per feature: feat/, fix/, chore/, refactor/.
Branch off an up-to-date main; open a PR rather than pushing to main.
Never commit backend/.env (or a future frontend/.env). The .gitignore patterns have no leading slash so they match at any depth — do not "fix" them by anchoring them to the root. Before any first push to a new remote, verify no .env is in history — adding it to .gitignore afterwards does not remove it from past commits.
Testing
Tests live in backend/src/__tests__/ and run from backend/ with npm test.
backend/src/app.ts exports the app precisely so Supertest can import it without binding a port. Keep the split.
Tests must be order-independent and repeatable: clean up rows created by each test. A suite that only passes in one order is a broken suite.
DATABASE_URL comes from the environment (backend/.env locally, job-level env in CI). Never hardcode the Supabase URL — CI points at an ephemeral Postgres service container.
CI is .github/workflows/ci.yml at the repo root, with two independent jobs that run in parallel: backend (Postgres service, migrate deploy, tsc --noEmit, vitest) and frontend (lint, build). Neither needs the other — a frontend type error and a backend test failure are separate signals, and chaining them would hide one behind the other.
Each job sets defaults.run.working-directory. That does NOT apply to action inputs, so setup-node's npm cache names backend/package-lock.json or frontend/package-lock.json explicitly.
The frontend job must set VITE_API_URL. Without it the bundler tree-shakes the whole app away (see frontend invariant 3) and the build passes on an empty bundle.
The concurrent-order test (two requests, stock = 1, expect exactly one 201 and one 409) covers the single most important behavior here. If it turns out flaky in CI, mark it .skip with a comment explaining why — do not delete it.
Known gaps

Real, not oversights to be fixed while doing something else:

No rate limiting. /api/auth/login can be brute-forced.
No refresh tokens. A 1-day JWT can't be revoked; logout is client-side only.
price serializes as a JSON string ("39.99", 32.50 → "32.5", 38.00 → "38"). That's Prisma's Decimal behavior. The frontend handles it in lib/money.ts — see frontend invariant 7.
No status-transition rules beyond cancel. SHIPPED → PENDING is currently legal.
No structured logging. console.error only; production wants Pino or Winston with request IDs.
No payment integration, not deployed.
The frontend has no automated tests. CI lints and builds it (which type checks it via tsc -b), but nothing asserts behaviour. The cart/checkout logic was deliberately factored into pure modules (cart/cartOps.ts, cart/cartStorage.ts, orders/checkoutError.ts, lib/money.ts) that a test suite can exercise without a DOM — that is where frontend tests should start.
The frontend covers auth, the product catalog (browse, search, category filter, pagination, product detail), and the buying path (cart, checkout, order confirmation). No order history list or admin screens yet.
No idempotency on POST /api/orders. A retried or duplicated request creates a second order; only the client's in-flight guard prevents it.
The token is in localStorage. See frontend invariant 4 — this is an accepted XSS exposure, not an oversight.