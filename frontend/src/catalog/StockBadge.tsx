/** Below this, show the actual count — "Only 2 left" reads very differently from "In stock". */
const LOW_STOCK_THRESHOLD = 5;

const BASE = "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium";

/**
 * Stock state as a label.
 *
 * Out-of-stock products stay in the grid and are marked rather than filtered
 * out: hiding them makes a product the user searched for by name simply not
 * exist, with no explanation.
 */
export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className={`${BASE} border-red-200 bg-red-50 text-red-700`}>Out of stock</span>;
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className={`${BASE} border-amber-200 bg-amber-50 text-amber-800`}>
        Only {stock} left
      </span>
    );
  }

  return (
    <span className={`${BASE} border-emerald-200 bg-emerald-50 text-emerald-700`}>In stock</span>
  );
}
