const TOKEN_KEY = "ecommerce.token";

export type Role = "CUSTOMER" | "ADMIN";

/**
 * The JWT claims the backend signs (see backend/src/utils/jwt.ts).
 * `exp` is added by jsonwebtoken from its 1-day expiresIn.
 */
export interface TokenPayload {
  userId: string;
  role: Role;
  exp: number;
  iat: number;
}

/*
 * TRADEOFF — the token lives in localStorage.
 *
 * localStorage is readable by any JavaScript running on this origin, so a
 * single XSS hole (a bad dependency, an unescaped bit of user content) hands
 * an attacker a valid 1-day token that cannot be revoked — the backend has no
 * refresh tokens and no server-side session to invalidate. That is a real
 * exposure, not a theoretical one.
 *
 * It is chosen here for simplicity: it survives a refresh with no extra
 * backend work. The production answer is an httpOnly, Secure, SameSite cookie
 * that JavaScript cannot read at all, which needs the backend to set and clear
 * the cookie and to carry CSRF protection. Revisit this before shipping
 * anything real.
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-mode Safari and hardened browser settings can throw on access.
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Non-fatal: the session simply won't survive a refresh.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing useful to do — the in-memory state is cleared regardless.
  }
}

/**
 * Reads the claims out of a JWT without verifying the signature.
 *
 * This is for UI branching only (showing an admin nav item, skipping a
 * pointless request for an already-expired token). It proves nothing: anyone
 * can forge these claims locally. Every real authorization decision is the
 * backend's — requireAuth verifies the signature and requireAdmin checks the
 * role on every request.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url -> base64: the JWT alphabet swaps +/ for -_ and drops padding.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    const claims = JSON.parse(atob(padded)) as Partial<TokenPayload>;
    if (typeof claims.userId !== "string" || typeof claims.exp !== "number") return null;
    if (claims.role !== "CUSTOMER" && claims.role !== "ADMIN") return null;

    return claims as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * True when the token is malformed or its `exp` has passed.
 *
 * Checked before the first request on boot so an overnight-expired token sends
 * the user straight to /login instead of flashing the app and then bouncing
 * them on a 401. The backend still rejects expired tokens regardless — this is
 * a smoother path to the same outcome, never a substitute for it.
 */
export function isTokenExpired(token: string): boolean {
  const claims = decodeToken(token);
  if (!claims) return true;

  // A few seconds of slack for clock skew between the browser and the server.
  return claims.exp * 1000 <= Date.now() - 5000;
}
