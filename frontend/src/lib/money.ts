/*
 * `price` arrives from the API as a JSON *string* — "39.99", and 32.50 as
 * "32.5". That is Prisma serializing a Decimal(10,2): sending it as a JSON
 * number would round-trip the value through a binary float, which is exactly
 * the drift the backend uses Decimal to avoid (see CLAUDE.md, money invariants).
 *
 * The consequence for this app is that the raw string is NOT display-ready.
 * Postgres drops trailing zeros, so rendering `product.price` directly puts
 * "$32.5" next to "$39.99" on the same row.
 *
 * This module is the one place that string becomes a number. Scattering
 * `Number(price)` and `.toFixed(2)` through components is how two products end
 * up formatted differently, so components import `formatPrice` and never touch
 * the raw value themselves.
 */

// The only place the app's currency is decided. Constructing the formatter once
// matters: Intl.NumberFormat is expensive, and a grid re-render calls this for
// every card on the page.
const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Shown when a price can't be parsed — see the note in `formatPrice`. */
const UNKNOWN_PRICE = "—";

/**
 * Renders a raw API price string as currency: "39.99" → "$39.99", and
 * "32.5" → "$32.50".
 *
 * A price that won't parse renders as an em dash rather than "$NaN" or a
 * thrown error. The backend can't actually produce one, so this is only a
 * guard against a malformed response taking down the whole grid — a single
 * unreadable price is a much better failure than a blank page.
 */
export function formatPrice(raw: string): string {
  // Number("") and Number("   ") are both 0, which would happily format as
  // "$0.00" — a missing price must not render as free.
  if (typeof raw !== "string" || raw.trim() === "") return UNKNOWN_PRICE;

  const value = Number(raw);
  if (!Number.isFinite(value)) return UNKNOWN_PRICE;

  return CURRENCY_FORMAT.format(value);
}
