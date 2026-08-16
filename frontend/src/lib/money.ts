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
 *
 * The same rule covers arithmetic. A cart adds prices up, and doing that in
 * floating point is how a five-line cart lands a cent off the total the backend
 * charges: 0.1 + 0.2 is 0.30000000000000004 in every JS runtime. The backend
 * avoids it with Prisma.Decimal; this module avoids it by converting to whole
 * cents first and never leaving integer arithmetic until the final format.
 *
 * None of these totals are ever *sent* anywhere. The backend recomputes the
 * price of every line from its own product rows inside the order transaction
 * (see backend/src/routes/orders.ts) and the request body has no price field at
 * all. What's computed here is a preview of what the customer is about to be
 * charged, nothing more.
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
  return formatCents(toCents(raw));
}

/**
 * A raw API price as a whole number of cents — "32.5" → 3250 — or null if it
 * can't be read as a price.
 *
 * Cents are the unit every calculation in this app works in. The column is
 * Decimal(10, 2), so a price is exactly representable as an integer of cents,
 * and integers add and multiply without drift. `Math.round` is here for the
 * float introduced by `* 100` itself (1.15 * 100 is 114.99999999999999), not
 * because prices can carry more than two decimals.
 */
export function toCents(raw: string): number | null {
  // Number("") and Number("   ") are both 0, which would happily format as
  // "$0.00" — a missing price must not render as free.
  if (typeof raw !== "string" || raw.trim() === "") return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

/** Renders a whole-cent amount: 3250 → "$32.50". null renders as the em dash. */
export function formatCents(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return UNKNOWN_PRICE;
  return CURRENCY_FORMAT.format(cents / 100);
}

/**
 * One cart line: unit price × quantity, in cents.
 *
 * Multiplying the integer cent price keeps this exact — `Number("0.1") * 3` is
 * 0.30000000000000004, but `10 * 3` is 30.
 */
export function lineTotalCents(price: string, quantity: number): number | null {
  const unit = toCents(price);
  if (unit === null || !Number.isInteger(quantity)) return null;
  return unit * quantity;
}

/**
 * Adds cent amounts.
 *
 * A single unreadable amount makes the whole sum unknown rather than silently
 * dropping out of it — a total that is quietly missing a line is worse than a
 * total that admits it doesn't know.
 */
export function sumCents(amounts: Array<number | null>): number | null {
  let total = 0;
  for (const amount of amounts) {
    if (amount === null) return null;
    total += amount;
  }
  return total;
}
