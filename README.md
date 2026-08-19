# E-commerce Mini Platform — Backend

![CI](https://github.com/putanetwanthanasak/ecommerce_mini/actions/workflows/ci.yml/badge.svg)

## Day 1 deliverable
- Prisma schema (User, Category, Product, Order, OrderItem) with proper relations & indexes
- Auth: register / login with bcrypt password hashing + JWT
- Middleware: `requireAuth` (validates JWT), `requireAdmin` (role check), centralized error handler
- Zod validation on all input

## Setup (run these on your own machine)

1. Install dependencies (already done if you unzip this as-is):
   ```
   npm install
   ```

2. Get a free PostgreSQL database. Fastest options:
   - [Supabase](https://supabase.com) — free tier, gives you a connection string instantly
   - [Neon](https://neon.tech) — same idea, serverless Postgres
   - Or run Postgres locally / via Docker

3. Copy `.env.example` to `.env` and fill in your real `DATABASE_URL` and a random `JWT_SECRET`:
   ```
   cp .env.example .env
   ```

4. Generate the Prisma client and run the first migration:
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the dev server:
   ```
   npm run dev
   ```

6. Test it:
   ```bash
   # Register
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

   # Login
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'

   # Use the returned token to call a protected route
   curl http://localhost:4000/api/users/me \
     -H "Authorization: Bearer <token_from_login>"
   ```

7. (Optional) Browse your data visually:
   ```
   npx prisma studio
   ```

## Design decisions worth mentioning in interviews
- `OrderItem.priceAtPurchase` is stored separately from `Product.price` — product prices
  can change over time, but past orders must keep the price the customer actually paid.
- Password comparison errors return the same generic message for "user not found" and
  "wrong password" — this avoids leaking which emails are registered.
- Error handling is centralized in one Express middleware so every route returns a
  consistent JSON error shape instead of ad-hoc try/catch messages.

## Deployment

Backend on **Render**, frontend on **Vercel**, database stays on the existing
**Supabase** instance. Two committed config files make this reproducible:
`render.yaml` (repo root) and `frontend/vercel.json`.

No secret is in either file. Everything sensitive is marked `sync: false` in
`render.yaml`, which tells Render to prompt for it rather than read it from git.

### The Supabase connection: the pooler is required, not optional

`db.<project-ref>.supabase.co` — the direct connection — resolves to **IPv6
only**. There is no A record, only AAAA. Render does not provide outbound IPv6,
so **the direct connection string cannot be used from Render at all**. Supabase's
Supavisor pooler is the only reachable path, and both of its hosts do have IPv4.

That forces a split, because the two pooler modes are good at different things:

| | Host / port | Used for |
|---|---|---|
| **Transaction mode** | `aws-0-<region>.pooler.supabase.com:6543` + `?pgbouncer=true` | the running app (`DATABASE_URL`) |
| **Session mode** | `aws-0-<region>.pooler.supabase.com:5432` | migrations (`DIRECT_URL`) |

Note the username changes for the pooler: it is `postgres.<project-ref>`, not
`postgres`.

**Migrations must not run through transaction mode.** Prisma Migrate takes a
session-level advisory lock, which transaction pooling cannot hold, and the
failure mode is the worst kind: `prisma migrate deploy` against port 6543 does
not error, it **hangs indefinitely** — measured sitting for five minutes with no
output. A release command wired to the pooled URL would hang every deploy.

That is what `directUrl` in `prisma/schema.prisma` is for: Prisma Migrate uses
`DIRECT_URL` while the app keeps the pooled `DATABASE_URL`. Once declared,
`DIRECT_URL` is **required** — Prisma fails with `P1012` if it is missing, with no
fallback — so local `.env`, `.env.example` and the CI job all define it. Locally
and in CI it is just the same value as `DATABASE_URL`; only production differs.

What was verified against the pooler, rather than assumed:

- The full 21-test suite passes through **transaction mode**, including the
  concurrent-order race — so the row-level `updateMany` stock guard and the
  consistent lock ordering (CLAUDE.md invariants 1 and 2) survive pooling.
- An interactive `$transaction()` stays pinned to a single `txid` through the
  pooler, which is what `routes/orders.ts` depends on.
- `current_user` through the pooler is still `postgres`, which is `BYPASSRLS` —
  so invariant 8 (RLS on, no policies) is unaffected.
- `migrate deploy` through **session mode** exits 0 cleanly.

### Backend — Render

`render.yaml` describes the service; these are the parts that matter:

- **Build:** `npm ci --include=dev && npx prisma generate && npm run build`.
  `prisma generate` is not optional — the generated client lives in
  `node_modules` and is not committed, so the compiled output would import
  something that does not exist. `--include=dev` is not optional either, for the
  reason below.
- **`--include=dev` is required, and the error does not say so.** Render injects
  env vars into the **build** as well as the runtime, and npm reads
  `NODE_ENV=production` as "omit devDependencies" — so a plain `npm ci` installs
  no TypeScript and no `@types/*`, in a TypeScript project. The build fails with
  what look like missing dependencies:

  ```
  src/app.ts:   error TS7016: Could not find a declaration file for module 'cors'
  src/index.ts: error TS2580: Cannot find name 'process'
  ```

  Reproduced from a clean checkout: without the flag `npm run build` exits 2 with
  exactly those errors; with it, exit 0 and `dist/` is emitted.

  It misleads in a second way — `typescript` and `prisma` *do* survive a
  production install, because `@prisma/client` depends on both. So the compiler is
  there and only the `@types/*` are missing. That is incidental to Prisma's
  dependency tree, not something to rely on.

  Do not fix this by moving `@types/*` into `dependencies`; that puts build-only
  packages in the runtime's dependency list permanently. Setting `NODE_ENV` only
  at runtime is not really available either: Render has no build-vs-runtime
  scoping for env vars, so it would mean dropping `NODE_ENV` from `envVars` and
  inlining it into `startCommand` — hiding a load-bearing value in a command
  string, showing it as unset in the dashboard, and `src/lib/prisma.ts` branches
  on it.

  On Render's native Node runtime the build and the running service share a
  filesystem, so devDependencies do stay on disk at runtime — they are simply
  never imported. `&& npm prune --omit=dev` would strip them (verified to leave
  `@prisma/client` and the generated query engine intact); it is left off because
  the gain is unused disk on a free instance and the failure mode is worse than
  the problem.
- **Start:** `npm run start` → `node dist/index.js`. Never `ts-node-dev` — that is
  the dev watcher and it skips type checking entirely.
- **Health check:** `/health`.
- **No pre-deploy command.** Migrations are applied manually — see below.

### Migrations are applied manually, before deploying

There is no `preDeployCommand` in `render.yaml`, because **Render rejects it on
the free tier**. It is not ignored with a warning — it fails blueprint
validation outright, and the service cannot be created at all:

```
services[0] pre-deploy command is not supported for free tier services
```

So apply migrations deliberately from a trusted machine **before** deploying,
pointing at the **session-mode** URL:

```bash
cd backend && DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
```

`DATABASE_URL` is overridden on purpose. Prisma Migrate needs a session-level
advisory lock that the transaction-mode pooler (port 6543) cannot hold — there it
**hangs indefinitely** rather than failing. `DIRECT_URL` is the session-mode
endpoint (port 5432).

Always `migrate deploy`, never `migrate dev`: deploy only applies committed
migration files and never prompts, while dev can decide the schema has drifted
and offer to **reset the database**.

**The schema is already current on Supabase, so nothing is pending for the first
deploy.** This step only matters once a new migration is added.

**Do not work around the free-tier limit by appending `npx prisma migrate deploy`
to `buildCommand`.** A build runs on branches, can run concurrently with another
build, and is retried automatically — so DDL there can hit a live database at a
moment nobody chose, possibly twice at once. The build stays a pure compile step.

Upgrading off the free tier is what makes this automatable again; `render.yaml`
carries the exact line to restore, and in the release phase a non-zero exit
aborts the deploy with the old version still serving.

Set these four in the Render dashboard (the rest come from `render.yaml`):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supavisor **transaction** URL, port **6543**, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supavisor **session** URL, port **5432** |
| `JWT_SECRET` | a freshly generated secret — **not** the development one |
| `CORS_ORIGINS` | the Vercel origin, plus `http://localhost:5173` |

Generate a production `JWT_SECRET` with:

```bash
node -e 'console.log(require("crypto").randomBytes(48).toString("base64"))'
```

Reusing the development secret would mean a token minted on a laptop is accepted
by production. Changing it later invalidates every token already issued.

### Frontend — Vercel

Set **Root Directory** to `frontend`. Build and output come from
`frontend/vercel.json` (`npm run build` → `dist`).

Set one environment variable: **`VITE_API_URL`** = the Render URL, with no
trailing slash.

**This one is load-bearing in a way that hides itself.** `src/lib/api.ts` throws
at module load when `VITE_API_URL` is missing. That throw is at the top level, so
the bundler treats everything after it as dead code and eliminates the entire
app — and the build still **exits 0**. Measured on this project:

| | Bundle | Contains `"Sign in"` |
|---|---|---|
| without `VITE_API_URL` | 224 KB | **no — app eliminated** |
| with `VITE_API_URL` | 316 KB | yes |

The bundle is not empty in the broken case — it is still 224 KB of React — so
**size alone does not catch this**. Check for app content:

```bash
grep -c "Sign in" dist/assets/*.js     # must be >= 1
```

A green deploy is not evidence the app shipped. The same reasoning is why the CI
frontend job sets `VITE_API_URL`.

Because it is a single-page app, `vercel.json` rewrites all routes to
`/index.html`. Without it, a direct link to `/orders/<id>` or a refresh on any
non-root route returns 404, since no file exists at that path. Real files still
win: Vercel only applies rewrites after the filesystem check, so hashed assets
are served normally.

### CORS

The API used to call bare `cors()`, which reflects any origin — fine for a
local-only service, wrong on the public internet. It now reads `CORS_ORIGINS`
(comma-separated) — see `backend/src/lib/corsOptions.ts`.

Requests with **no** `Origin` header are always allowed: that covers curl,
Render's own health check and Supertest. CORS is enforced by the browser, so
refusing them would break tooling while stopping no attacker. A disallowed origin
gets no CORS headers rather than an error response — the request is refused by the
browser, and returning a 500 would make a blocked origin look like a broken API.

Unset, it falls back to `http://localhost:5173`, so an unconfigured production
deploy fails closed rather than open.

### Cold starts on the free tier

Render's free tier stops the container after ~15 minutes idle, so the first
request afterwards waits **30-50 seconds** for a cold start. This is inherent to
the tier and is deliberately not worked around — a keep-alive pinger just burns
the free instance hours to hide it.

What is handled is the user-facing symptom. If an auth submit is still running
after four seconds, the form says so: *"Still working — the server sleeps when
idle, so the first request can take up to a minute. This will go through; no need
to reload."* Without that, the first login of the day is indistinguishable from a
hung app, and the natural reaction is to reload — which abandons the request that
was already warming the server and starts the wait over. It lives in
`SubmitButton`, so login and register both get it.

Expect the same delay on the first catalog load after an idle period.

## Next up (Day 2)
Product CRUD API + Product listing UI.
