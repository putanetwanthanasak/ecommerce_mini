import { getStoredToken } from "./token";

// Never hardcoded — the same build has to point at localhost in dev and a real
// host later. Failing loudly at module load beats silently issuing requests to
// the Vite dev server's own origin and getting a wall of confusing 404s.
const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) {
  throw new Error("VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.");
}

/** One entry of the backend's Zod validation payload. */
export interface ApiErrorDetail {
  path: string;
  message: string;
}

/**
 * Every non-2xx response becomes one of these.
 *
 * The backend has exactly two error shapes (see backend/src/middleware/errorHandler.ts):
 *   { error: "Validation failed", details: [{ path, message }] }   — every ZodError, 400
 *   { error: "<message>" }                                        — everything else
 */
export class ApiError extends Error {
  // Declared as plain fields rather than constructor parameter properties:
  // the Vite template enables erasableSyntaxOnly, which forbids any TS syntax
  // that emits runtime code.
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(status: number, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  /**
   * Validation details keyed by field, for rendering under the matching input.
   * Showing only the top-level "Validation failed" would tell the user nothing
   * about which field is wrong — the details array is the whole point.
   */
  get fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const detail of this.details) {
      // First message per field wins; later ones would just overwrite it.
      if (detail.path && !fields[detail.path]) fields[detail.path] = detail.message;
    }
    return fields;
  }

  /** Validation messages that aren't attached to a field we render. */
  get unfieldedDetails(): string[] {
    return this.details.filter((d) => !d.path).map((d) => d.message);
  }
}

/**
 * Called when an authenticated request comes back 401 — the token is expired,
 * revoked-by-restart, or otherwise no longer good. AuthProvider registers a
 * handler that drops the session; ProtectedRoute then bounces the user to
 * /login on the next render.
 *
 * Deliberately not a window.location redirect: that would throw away React
 * state and full-reload the app mid-flight. Clearing auth state and letting the
 * router react keeps it a normal navigation.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * Attach the stored token. Default true.
   *
   * Login and register pass false, and that distinction is what makes the 401
   * rule below safe: a 401 from an *authenticated* request means the session
   * died, but a 401 from login just means the password was wrong. Treating the
   * second like the first would be harmless-looking and wrong.
   */
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = auth ? getStoredToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects for transport failures — server down, DNS, CORS block.
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  // 204 has no body; a few endpoints could grow one later.
  const payload = response.status === 204 ? null : await readJson(response);

  if (response.ok) {
    return payload as T;
  }

  const message =
    typeof payload?.error === "string" ? payload.error : `Request failed (${response.status})`;
  const details: ApiErrorDetail[] = Array.isArray(payload?.details) ? payload.details : [];

  // 401 — not authenticated. The token is missing, malformed or expired, so the
  // session is over: drop it and let the router send the user to /login.
  if (response.status === 401 && token) {
    onUnauthorized();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  // 403 — authenticated, but not permitted (wrong role, or someone else's row).
  // The token is still perfectly valid, so logging the user out here would be a
  // bug: it turns "you can't do that" into "you've been signed out". Fall
  // through and surface it like any other error.
  throw new ApiError(response.status, message, details);
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON body (a proxy's HTML error page, an empty 500).
    return null;
  }
}
