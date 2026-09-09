import { useEffect, useRef, useState } from "react";
import { getStockState } from "./stockState";

/**
 * Stock, as a plain figure in the STOCK column.
 *
 * THIS WAS A BADGE AND IT WAS WRONG. The old version printed a *word* — "In stock" —
 * and only revealed the actual count below the low threshold. Since every seeded row
 * sits above that threshold, the number was never shown. But the count is the fact
 * a shopper actually wants, so it is always printed, in tabular figures:
 *
 *   settled   signal green. Nothing about it is going to change.
 *   low       amber — the reserved colour for a figure that can still change.
 *   gone      struck through in alert red, and there is no figure to print.
 *
 * When the count changes between renders the figure does a brief fade-up settle
 * (`animate-figure-update`) — subtle, generic, just enough to register that the one
 * number on the page that updates in place has moved. The global
 * `prefers-reduced-motion` block collapses it to a static figure.
 */
export function StockCell({ stock }: { stock: number }) {
  const changed = useRecentlyChanged(stock);
  const state = getStockState(stock);

  if (state === "out-of-stock") {
    return (
      <span className="text-rail font-semibold tracking-[0.12em] text-critical uppercase">
        {/* <s> is the honest element: this is information that is no longer accurate. */}
        <s>Out of stock</s>
      </span>
    );
  }

  const low = state === "low-stock";

  return (
    <span
      className={`inline-flex items-baseline gap-1.5 ${low ? "text-amber" : "text-signal"}`}
      // The count and its unit are one fact; announcing them separately reads as
      // two. Screen readers get the sentence, sighted users get the column.
      aria-label={low ? `Only ${stock} left` : `${stock} in stock`}
    >
      <span
        aria-hidden="true"
        className={`figures text-row ${changed ? "animate-figure-update" : ""}`}
      >
        {stock}
      </span>
      <span aria-hidden="true" className="text-rail font-semibold tracking-[0.12em] uppercase">
        {low ? "left" : "in stock"}
      </span>
    </span>
  );
}

/**
 * True for one animation's length after `value` changes — and never on first paint,
 * so a page load does not animate every figure in the list at once.
 */
function useRecentlyChanged(value: number): boolean {
  const previous = useRef(value);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setChanged(true);
    const timer = window.setTimeout(() => setChanged(false), 340);
    return () => window.clearTimeout(timer);
  }, [value]);

  return changed;
}
