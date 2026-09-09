/**
 * The one place the stock thresholds live.
 *
 * Two components read the same fact and must never disagree about where the
 * cutoffs are: StockCell (the printed figure on the product detail page) and
 * StockBadge (the pill overlaid on a catalog card). This was inlined in
 * StockCell; it moved here the moment a second component needed it.
 */

/** At or below this, a count is "low" — worth flagging, not yet gone. */
export const LOW_STOCK_THRESHOLD = 5;

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

export function getStockState(stock: number): StockState {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}
