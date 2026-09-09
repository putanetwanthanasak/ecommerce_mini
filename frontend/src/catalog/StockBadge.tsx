import { Badge } from "../components/Badge";
import { AlertTriangleIcon, CheckIcon, XCircleIcon } from "../components/icons";
import { getStockState } from "./stockState";

/**
 * Stock state as a pill, overlaid on a product image in the catalog grid.
 *
 * The card can't spare a column for a printed figure the way the old list row
 * could, so on the grid the count rides on the image as a badge instead — the
 * same three states StockCell draws, in the shared Badge shape:
 *
 *   in-stock      positive (green), the exact count
 *   low-stock     caution (amber), "N left"
 *   out-of-stock  neutral, "Out of stock" — the dimmed image and the disabled
 *                 add button already carry the alarm; a red badge on top of
 *                 both is a third siren for one fact
 *
 * The count and its unit read as one phrase to a screen reader via `aria-label`;
 * the visible text is left to the badge.
 */
export function StockBadge({ stock }: { stock: number }) {
  const state = getStockState(stock);

  if (state === "out-of-stock") {
    return (
      <span aria-label="Out of stock">
        <Badge tone="neutral" icon={<XCircleIcon />}>
          Out of stock
        </Badge>
      </span>
    );
  }

  if (state === "low-stock") {
    return (
      <span aria-label={`Only ${stock} left`}>
        <Badge tone="caution" icon={<AlertTriangleIcon />}>
          {stock === 1 ? "1 left" : `${stock} left`}
        </Badge>
      </span>
    );
  }

  return (
    <span aria-label={`${stock} in stock`}>
      <Badge tone="positive" icon={<CheckIcon />}>
        {stock} in stock
      </Badge>
    </span>
  );
}
