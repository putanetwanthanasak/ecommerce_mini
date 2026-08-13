# Frontend

Vite + React + TypeScript SPA for the e-commerce mini platform. Talks to the
Express API in `../backend`.

**Scope so far: auth only.** Login, register, a protected route and a
placeholder home page. No catalog, cart or admin screens yet.

## Setup

```bash
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:4000
npm run dev             # http://localhost:5173
```

The backend has to be running too — `cd ../backend && npm run dev`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` — type checks, then bundles to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |

There are no automated tests here yet, and CI does not build this package —
the workflow covers `backend/` only.

## Layout

```
src/
├── lib/
│   ├── api.ts        # fetch wrapper: auth header, 401 vs 403, error shape
│   └── token.ts      # localStorage token + unverified claim decoding
├── auth/
│   ├── authApi.ts        # login / register / me
│   ├── authContext.ts    # context + useAuth
│   ├── AuthProvider.tsx  # session state, bootstrap, sign in/out
│   └── ProtectedRoute.tsx
├── components/       # presentational only
└── pages/            # Login, Register, Home
```

## Things worth knowing before you change this

- **401 and 403 mean different things.** A 401 on an authenticated request ends
  the session and redirects to `/login`. A 403 means the user is signed in and
  simply isn't allowed — it must not log them out. Both are handled in
  `lib/api.ts`; see the comments there.
- **Login and register send no token** (`auth: false`), which is what makes the
  above safe. A 401 from login means "wrong password", not "session expired".
- **The token lives in localStorage**, which any injected script can read. That
  tradeoff is deliberate and documented at the top of `lib/token.ts`; httpOnly
  cookies are the production answer.
- **`VITE_API_URL` is required.** `lib/api.ts` throws at import if it's missing
  rather than silently issuing requests at the dev server's own origin.
- **No role selector on register** — the API always creates a `CUSTOMER`.
