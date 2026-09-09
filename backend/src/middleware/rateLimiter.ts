import type { Request } from "express";
import { rateLimit, MemoryStore, ipKeyGenerator } from "express-rate-limit";

// Brute-force throttle for POST /api/auth/login. Scoped to that one route, not
// applied globally — the rest of the API is authenticated or cheap, and a global
// limiter would throttle a logged-in customer browsing the catalog.
//
// There is no config/constants module in this codebase (corsOptions.ts is the
// nearest precedent and it reads straight from env), so these live here as named
// constants next to the middleware that uses them.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // per key, per window

// The store is held here (rather than left implicit inside rateLimit) so the
// test suite can wipe it between cases via resetLoginRateLimiter(). Vitest runs
// every test file in one process and the counters otherwise persist for its
// whole life, so one test's failed logins would throttle the next. A single
// in-memory store is also all one Render instance needs; a multi-instance deploy
// would want a shared store (Redis) — noted as a follow-up in CLAUDE.md.
const store = new MemoryStore();

// Key on IP + email, not IP alone.
//
// IP-only would let a single NAT'd office, campus or mobile-carrier egress IP
// lock out every user behind it after 5 total attempts — disproportionate
// collateral for a login form. Keying on (IP, email) throttles the actual
// attack — hammering one known account — to 5 tries per window per source, while
// leaving unrelated users on the same IP unaffected.
//
// The tradeoff: an attacker spraying many different emails from one IP is not
// capped globally. That is acceptable here because login returns an identical
// 401 for "unknown email" and "wrong password" (no user enumeration — see the
// auth route), so an attacker cannot cheaply learn which emails are worth
// spraying. A separate, looser per-IP ceiling is the right place to add that
// later, not this limiter.
//
// ipKeyGenerator() normalises IPv6 (an attacker otherwise gets a fresh address,
// and a fresh counter, per request). In production behind Render's TLS edge
// req.ip is the proxy unless `trust proxy` is set, so the effective granularity
// there is per-email — coarser than per-source, but still a sound brute-force
// cap.
function loginRateLimitKey(req: Request): string {
  const rawEmail = (req.body as { email?: unknown } | undefined)?.email;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
}

export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  // RateLimit-* headers (RFC draft) instead of the deprecated X-RateLimit-*.
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginRateLimitKey,
  store,
  // Match the app's single error shape (see middleware/errorHandler.ts): a bare
  // { error: string }. Don't invent a new envelope for one status code.
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many login attempts. Please try again in a few minutes.",
    });
  },
});

// Test-only: clear every counter. Exported so auth.test.ts can reset between
// tests — see the comment on `store` above.
export function resetLoginRateLimiter(): void {
  store.resetAll();
}
