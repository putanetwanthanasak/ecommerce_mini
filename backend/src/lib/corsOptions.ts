import type { CorsOptions } from "cors";

/**
 * Which browser origins may call this API.
 *
 * Read from CORS_ORIGINS (comma-separated) rather than hardcoded, because the
 * allowed origin is deployment configuration: it is localhost in development and
 * the Vercel host in production, and the same build has to serve both. This
 * mirrors the frontend's rule that the API base URL is configuration, never a
 * literal (see CLAUDE.md, frontend invariant 3).
 *
 * The development fallback is the Vite dev server. Production is expected to set
 * the variable explicitly — an unset CORS_ORIGINS in production would leave the
 * API accepting only localhost, which fails closed rather than open.
 */
const DEV_FALLBACK = "http://localhost:5173";

export function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? DEV_FALLBACK;
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, "")) // a trailing slash is not part of an origin
    .filter((origin) => origin.length > 0);
}

export function corsOptions(): CorsOptions {
  const allowed = allowedOrigins();

  return {
    origin(origin, callback) {
      // No Origin header at all: curl, a Render health check, a server-to-server
      // call, or Supertest. CORS is a browser-enforced policy, so there is
      // nothing to protect here — rejecting these would only break tooling and
      // the platform's own uptime probe, while stopping no attacker.
      if (!origin) return callback(null, true);

      if (allowed.includes(origin.replace(/\/$/, ""))) return callback(null, true);

      // Deliberately `false` rather than an Error. An Error would travel to
      // errorHandler and surface as a 500, making a blocked origin look like the
      // API is broken. Returning false simply omits the CORS headers, which is
      // the accurate outcome: the request is refused by the browser, not the
      // server.
      return callback(null, false);
    },

    // Nothing here reads or sets cookies — auth is a bearer token in the
    // Authorization header (CLAUDE.md, frontend invariant 4). Enabling
    // credentials would require echoing an exact origin and would let a browser
    // attach cookies this API never wants to trust.
    credentials: false,
  };
}
