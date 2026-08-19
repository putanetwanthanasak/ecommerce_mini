# E-commerce Mini Platform

A full-stack store — Express + Prisma + PostgreSQL API, React SPA — built to prove that the hard
parts of a transaction are actually handled: stock that cannot be oversold under concurrent
checkout, orders that survive a price change, and authorization that holds at the row level.

![CI](https://github.com/putanetwanthanasak/ecommerce_mini/actions/workflows/ci.yml/badge.svg)

## Live demo

**https://ecommerce-mini-lyart.vercel.app**

> **The first request can take 30–50 seconds.** The API is on Render's free tier, which stops the
> container after ~15 minutes idle. The login form says so rather than appearing frozen — the
> request will go through, so don't reload. Everything after it is fast.

**Register an account to sign in** — email, password, name, about five seconds. There are
deliberately no shared demo credentials: checkout decrements real stock, so a public login would
leave the catalog sold out for the next visitor. The catalog sits behind the auth gate, so
registering is the way in.

## Stack

| | |
|---|---|
| **API** | Node 22, TypeScript 5.7, Express 5, Prisma 6, Zod 4 |
| **Database** | PostgreSQL 17 (Supabase), `Decimal(10,2)` for money |
| **Auth** | JWT + bcrypt |
| **Tests** | Vitest + Supertest — 21 tests, run in CI on every push |
| **Frontend** | React 19, Vite 8, Tailwind 4, React Router 7, TanStack Query 5 |
| **Deploy** | API on Render, SPA on Vercel, database on Supabase |

Two independent apps in one repo (`backend/`, `frontend/`), each with its own `package.json`. No
root manifest, no workspace tool.

## The engineering problems this solves

Every reader has seen an e-commerce CRUD app. These are the parts that are hard — each enforced in
code and covered by a test, not claimed in a comment. Deep version:
**[backend/CODE_GUIDE.md](backend/CODE_GUIDE.md)**.

### Overselling under concurrent checkout

A transaction alone is **not** sufficient. Prisma runs at `READ COMMITTED`, so two transactions can
both read `stock = 1`, both pass an `if (product.stock < quantity)` check, and both decrement —
stock lands at `-1` with two orders sold. The check gives a good error message; it is not a lock.

Safety comes from folding the condition *into* the write:

```ts
const claimed = await tx.product.updateMany({
  where: { id: item.productId, stock: { gte: item.quantity } },
  data:  { stock: { decrement: item.quantity } },
});
if (claimed.count === 0) throw new HttpError(409, `Insufficient stock for ${product.name}`);
```

`updateMany` is used for a logically single-row update precisely because it returns a match count —
zero means another transaction won the race, and the throw rolls the order back. The test
`"never oversells under concurrency: two requests for the last unit"` seeds `stock = 1`, fires two
orders through `Promise.all`, and asserts the statuses are exactly `[201, 409]` and final stock is
`0`. (Code guide §9, §10 *…but a check is not a lock*.)

### Deadlock prevention through sorted lock acquisition

With multiple product rows locked per order, two concurrent orders touching the same products in
opposite order deadlock; Postgres kills one and the client sees a 500. Every path that updates
multiple product rows sorts by `productId` first, so all transactions take locks in the same global
order and queue instead of colliding. Measured over **40 concurrent two-item orders**:

| | Succeeded | Deadlocked |
|---|---|---|
| Without the sort | 8 | 32 |
| With the sort | **40** | **0** |

A lock-ordering guarantee honoured by only part of a codebase isn't a guarantee, so the order and
cancel paths both sort. (Code guide §10 *Lock rows in a globally consistent order*.)

### Price integrity

`priceAtPurchase` is copied onto the order line inside the transaction, read off the product row —
never sent by the client. `POST /api/orders` accepts `{ productId, quantity }` and nothing else; a
client that can send a price can buy anything for a cent. Because it's snapshotted, repricing a
product doesn't rewrite what a customer was charged, and an order still totals what its own lines
say a month later.

Money is `Prisma.Decimal` via `.add()` and `.mul()`, never floats — binary floating point drifts by
cents across a long cart, and the column is `Decimal(10,2)`.

### Authorization depth

`401` and `403` are not interchangeable: 401 means "you aren't authenticated" and ends the session,
403 means "you are, and you still can't" and must not. Reversing them turns "you can't do that"
into "you've been logged out".

Middleware proves *who* (`requireAuth`) and *what role* (`requireAdmin`), but structurally cannot
know whether a row belongs to the caller — so per-row ownership checks live in the handler, and
`GET /api/orders/:id` returns 403 for another customer's order. A customer's list query is pinned to
the id in their own token; `?userId=` is consulted only on the admin branch and *ignored* rather
than rejected for customers, so no code path lets a customer's own filter widen their scope.

### Row-level security with zero policies

RLS is on for all six tables with **no policies at all**. That reads like a misconfiguration and is
the correct posture: the database is Supabase-hosted, so every table in `public` is exposed through
PostgREST and the client SDKs to anyone holding the anon key. RLS on with zero policies denies the
`anon` and `authenticated` roles every row, closing that path completely.

All traffic goes through the Express API, which connects as `postgres` — table owner and
`BYPASSRLS` — so Prisma is unaffected; policies would only ever be consulted by a client that
doesn't exist here. A permissive `USING (true)` policy would re-open exactly what this shuts. It's a
migration rather than a dashboard click, so CI applies it too.

## Screenshots

<!-- SCREENSHOT PLACEHOLDER 1 — catalog -->
> _**[screenshot: the catalog at `/products`]** — capture the grid with all three stock states
> visible at once: an in-stock item, a low-stock one ("1 LEFT" in amber), and a sold-out one struck
> through._

<!-- SCREENSHOT PLACEHOLDER 2 — order detail -->
> _**[screenshot: an order at `/orders/:id`]** — capture the line items showing `priceAtPurchase`
> and the order total._

## Running it locally

Needs Node 22 and a PostgreSQL database. Two apps, run separately.

```bash
git clone https://github.com/putanetwanthanasak/ecommerce_mini.git
cd ecommerce_mini/backend

npm install
cp .env.example .env          # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET

npx prisma generate
npx prisma migrate deploy     # applies committed migrations; never `migrate dev` on a real DB
npm run dev                   # http://localhost:4000
```

```bash
cd ../frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm run dev                   # http://localhost:5173
```

`npm run dev` on the API uses `--transpile-only` and does **no** type checking — code with type
errors runs in dev and fails at build. Run `npx tsc --noEmit` before committing.

`VITE_API_URL` fails in a way that hides itself: `src/lib/api.ts` throws at module load if it's
missing, and because that throw is top-level the bundler eliminates the whole app while the build
still **exits 0**. A broken bundle is ~224 KB of React with none of the app in it; a good one is
~316 KB. Check content, not size — `grep -c "Sign in" dist/assets/*.js`.

### Tests

```bash
cd backend
npm test                      # 21 tests, 4 files
npx tsc --noEmit
```

Tests run against a real database and clean up the rows they create, so they're repeatable and
order-independent. CI points them at an ephemeral Postgres.

### If you use Supabase: three gotchas

These cost real debugging time, and anyone following this setup will hit them.

**1. The direct connection host is IPv6-only.** `db.<project-ref>.supabase.co` has no A record, only
AAAA, so any platform without outbound IPv6 — Render's free tier included — cannot reach it at all.
Use the Supavisor pooler; note the username becomes `postgres.<project-ref>`.

**2. `?pgbouncer=true` is required on the pooled URL, and omitting it fails only under load.**
Without it Prisma's prepared statements collide when the pooler reuses a server connection across
sessions: `ERROR 42P05: prepared statement "s13" already exists`. A single-client test passes
happily — 12/12 queries succeeded — while 6 concurrent clients produced 24 failures out of 36. That
combination is what makes it dangerous: fine in dev, broken in production.

**3. `DIRECT_URL` must be the session-mode port, or `migrate deploy` hangs instead of failing.**
Prisma Migrate takes a session-level advisory lock that transaction-mode pooling can't hold. Against
port 6543 it doesn't error — it sat for five minutes with no output. `DIRECT_URL` points at 5432
(session mode) so migrations get that lock while the app keeps the pooled connection.

```
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Render blueprint, Vercel SPA rewrite and CORS specifics: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Known limitations

Understood tradeoffs, not oversights:

- **No rate limiting.** `/api/auth/login` can be brute-forced.
- **No refresh tokens.** A 1-day JWT can't be revoked; logout is client-side only. The token lives
  in `localStorage` — an accepted XSS exposure, with httpOnly cookies as the production answer.
- **No idempotency key on order creation.** Two identical concurrent `POST`s create two orders and
  decrement stock twice. Only the client's in-flight guard prevents it, which is why checkout offers
  no retry button.
- **`Decimal` serializes as a JSON string** with trailing zeros dropped — `38.00` arrives as `"38"`,
  `32.50` as `"32.5"`. That's Prisma's behaviour; one frontend module owns the formatting.
- **No admin UI**, though the `ADMIN` role is real and API-enforced. Admins are promoted directly in
  the database; operators use Prisma Studio.
- **No product images, and no schema column for them.** Adding photography means a migration and
  somewhere to host files, not a CSS change.
- **No payment step.** Checkout places an order; `PAID` is a status nothing sets from the UI.
- **No status-transition rules beyond cancel.** `SHIPPED → PENDING` is currently legal.
- **No frontend tests.** CI lints and type checks it; the cart and checkout logic was factored into
  pure modules so a suite can start there without a DOM.
