import { useEffect, useRef, useState } from "react";

/** Below this, the count is the headline and it turns amber. */
const LOW_STOCK_THRESHOLD = 5;

/**
 * Stock, as a printed figure on the board.
 *
 * THIS WAS A BADGE AND IT WAS WRONG. The old version printed a *word* — "In stock" —
 * and only revealed the actual count below the low threshold. Since every seeded row
 * sits above that threshold, the board never printed a number and amber never
 * appeared on any surface in the app. That hollowed out the whole thesis: a
 * departures board exists to make a *changing number* trustworthy at a glance, and
 * this one was showing a binary word in a grey capsule.
 *
 * So the count is always printed, in tabular figures, in the STOCK column:
 *
 *   settled   signal green. The flap has stopped turning.
 *   low       amber — the board's reserved colour for a figure that can still change.
 *   gone      struck through in alert red, and there is no figure to print.
 *
 * THE TURN. When the count changes between renders the figure flips once, the way a
 * flap does. It is the surface's single authored moment, deliberately spent here
 * rather than scattered across hovers, because this is the one number on the page
 * that is allowed to move. It starts and ends fully visible — the flip is rotation,
 * never a fade from nothing — and the global `prefers-reduced-motion` block already
 * collapses it to a static figure.
 */
export function StockCell({ stock }: { stock: number }) {
  const turning = useFigureTurn(stock);

  if (stock <= 0) {
    return (
      <span className="text-rail font-semibold tracking-[0.12em] text-critical uppercase">
        {/* <s> is the honest element: this is information that is no longer accurate. */}
        <s>Out of stock</s>
      </span>
    );
  }

  const low = stock <= LOW_STOCK_THRESHOLD;

  return (
    <span
      className={`inline-flex items-baseline gap-1.5 ${low ? "text-amber" : "text-signal"}`}
      // The count and its unit are one fact; announcing them separately reads as
      // two. Screen readers get the sentence, sighted users get the column.
      aria-label={low ? `Only ${stock} left` : `${stock} in stock`}
    >
      <span
        aria-hidden="true"
        className={`figures text-row ${turning ? "animate-flap-turn" : ""}`}
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
 * so a page load does not flip every figure on the board at once.
 */
function useFigureTurn(value: number): boolean {
  const previous = useRef(value);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setTurning(true);
    const timer = window.setTimeout(() => setTurning(false), 420);
    return () => window.clearTimeout(timer);
  }, [value]);

  return turning;
}
