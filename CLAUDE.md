CLAUDE.md

Project context for Claude Code. Read this before making changes.

What this is

E-commerce mini platform. Portfolio project — the goal is code that demonstrates real backend engineering (concurrency safety, authorization, data integrity), not just working CRUD.

Status: Auth, Category, Product, and Order routes are complete and manually verified. Automated tests and CI are done — 21 Vitest/Supertest tests in backend/src/__tests__/, including the concurrent-order race, with GitHub Actions running typecheck plus the suite against an ephemeral Postgres on every push and PR, alongside a parallel job that lints and builds the frontend. The frontend exists but only covers setup and auth: login, register, a protected route and a placeholder home page. No catalog, cart or admin screens yet, and no frontend tests. Not deployed anywhere.

Repository layout

This is a monorepo. Everything backend lives under backend/ — paths in this document are relative to it unless stated otherwise.

.
├── backend/          # Express + Prisma API (this document is mostly about it)
│   ├── src/
│   ├── prisma/
│   ├── package.json  # backend deps; there is no root package.json
│   ├── .env          # never committed
│   └── CODE_GUIDE.md
├── frontend/         # Vite + React + TS SPA (auth only so far)
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
price serializes as a JSON string ("39.99", and 32.50 → "32.5"). That's Prisma's Decimal behavior. A frontend must Number() it and format trailing zeros.
No status-transition rules beyond cancel. SHIPPED → PENDING is currently legal.
No structured logging. console.error only; production wants Pino or Winston with request IDs.
No payment integration, not deployed.
The frontend has no automated tests. CI lints and builds it (which type checks it via tsc -b), but nothing asserts behaviour — the auth loop has only ever been checked by hand.
The frontend covers auth only. No catalog, cart, order history or admin screens yet.
The token is in localStorage. See frontend invariant 4 — this is an accepted XSS exposure, not an oversight.