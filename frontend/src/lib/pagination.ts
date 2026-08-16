/**
 * The pagination envelope every paginated endpoint returns.
 *
 * GET /api/products and GET /api/orders both wrap their results in exactly this
 * shape, so it lives here rather than inside either feature's api module — the
 * catalog does not own the concept, and importing it out of catalogApi to
 * render an order list would be a strange dependency to explain later.
 */
export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Parses a whole number >= 1 from a query param, falling back when the value is
 * missing, blank, fractional, negative or not a number at all.
 *
 * This is what keeps a hand-edited `?page=0` or `?page=abc` from being
 * forwarded to the backend as a guaranteed 400. Every list that keeps its page
 * in the URL needs the same rule, so there is one copy of it.
 */
export function readPositiveInt(raw: string | null, fallback: number, max: number): number {
  if (raw === null || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return fallback;

  return Math.min(value, max);
}
