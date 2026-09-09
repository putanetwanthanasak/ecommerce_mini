import { Link } from "react-router-dom";
import { ProductImage } from "../catalog/ProductImage";
import { TrashIcon } from "../components/icons";
import { formatCents, lineTotalCents } from "../lib/money";
import { QuantityStepper } from "./QuantityStepper";
import type { CartLine } from "./useCartLines";

interface CartRowProps {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/**
 * One cart line, matching the reference: a square thumbnail on the left, and on
 * the right a category eyebrow, the product name, the line total, then a
 * quantity stepper and a Remove button.
 */
export function CartRow({ line, onQuantityChange, onRemove }: CartRowProps) {
  const { item, status, stock, cap, name, category, imageUrl } = line;
  const unavailable = status === "gone";

  return (
    <li
      className={
        unavailable
          ? "flex gap-4 rounded-panel border border-critical-edge bg-critical-surface/40 p-4"
          : "surface flex gap-4 p-4"
      }
    >
      <Link
        to={`/products/${item.productId}`}
        aria-hidden="true"
        tabIndex={-1}
        className="block size-20 shrink-0 overflow-hidden rounded-control bg-surface-muted sm:size-24"
      >
        <ProductImage src={imageUrl} alt="" className="size-full" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {category && <p className="rail">{category}</p>}
            <h2 className="condensed leading-snug font-semibold text-ink">
              <Link
                to={`/products/${item.productId}`}
                className="focus-ring rounded-control transition hover:text-brand"
              >
                {name}
              </Link>
            </h2>
          </div>

          <span className="figures shrink-0 text-row text-ink">
            {formatCents(lineTotalCents(line.price, item.quantity))}
          </span>
        </div>

        <LineNotice line={line} onQuantityChange={onQuantityChange} onRemove={onRemove} />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            quantity={item.quantity}
            max={cap}
            disabled={unavailable}
            label={name}
            onChange={onQuantityChange}
          />

          <button
            type="button"
            onClick={onRemove}
            className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta font-medium text-ink-subtle transition hover:text-critical"
          >
            <TrashIcon />
            Remove
          </button>
        </div>
      </div>

      {/* Screen readers get the stock warning as it changes; sighted users see
          the same thing in LineNotice above. */}
      <span className="sr-only" role="status">
        {status === "short" && stock !== null
          ? `${name}: only ${stock} in stock, ${item.quantity} in cart`
          : ""}
      </span>
    </li>
  );
}

/**
 * The inline "this changed while your cart was sitting there" line.
 *
 * Each variant carries the fix as a button rather than telling the user to go
 * work it out. Nothing here edits the cart on its own — the user presses the
 * button or they don't.
 */
function LineNotice({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { item, status, stock, name } = line;

  if (status === "gone") {
    return (
      <p className="text-meta text-critical">
        No longer available — this product has been removed from the catalog.{" "}
        <button type="button" onClick={onRemove} className="font-medium underline">
          Remove it
        </button>{" "}
        to check out.
      </p>
    );
  }

  if (status === "short" && stock !== null) {
    if (stock <= 0) {
      return (
        <p className="text-meta text-caution">
          Out of stock since you added it.{" "}
          <button type="button" onClick={onRemove} className="font-medium underline">
            Remove it
          </button>{" "}
          to check out.
        </p>
      );
    }

    return (
      <p className="text-meta text-caution">
        Only {stock} left, but you have {item.quantity}.{" "}
        <button
          type="button"
          onClick={() => onQuantityChange(stock)}
          className="font-medium underline"
        >
          Reduce to {stock}
        </button>
      </p>
    );
  }

  if (status === "error") {
    // The request failed, so nothing is known about this product right now. Say
    // exactly that instead of implying the cart is fine or that it isn't.
    return (
      <p className="text-meta text-ink-subtle">
        Couldn't check current stock for {name}. Checkout will still be verified by the server.
      </p>
    );
  }

  return null;
}
