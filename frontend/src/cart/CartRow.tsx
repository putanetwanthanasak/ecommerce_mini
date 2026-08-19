import { Link } from "react-router-dom";
import { formatCents, formatPrice, lineTotalCents } from "../lib/money";
import { QuantityStepper } from "./QuantityStepper";
import type { CartLine } from "./useCartLines";

const LINK_BUTTON =
  "text-meta font-medium text-ink-muted underline-offset-4 transition hover:text-ink hover:underline";

interface CartRowProps {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartRow({ line, onQuantityChange, onRemove }: CartRowProps) {
  const { item, status, stock, cap, name, price } = line;
  const unavailable = status === "gone";

  return (
    <li
      className={`flex flex-wrap items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0 ${
        unavailable ? "bg-critical-surface/40" : ""
      }`}
    >
      <div className="min-w-48 flex-1">
        <Link
          to={`/products/${item.productId}`}
          className="text-meta font-medium text-ink underline-offset-4 hover:underline"
        >
          {name}
        </Link>
        {/* The unit price shown is the live one once the re-fetch lands, and the
            stored snapshot until then. Either way it is a preview: the backend
            prices the order from its own rows. */}
        <p className="mt-0.5 text-meta text-ink-subtle">
          <span className="figures">{formatPrice(price)}</span> each
        </p>

        <LineNotice line={line} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      </div>

      <QuantityStepper
        quantity={item.quantity}
        max={cap}
        disabled={unavailable}
        label={name}
        onChange={onQuantityChange}
      />

      <div className="w-24 text-right figures text-meta text-ink">
        {formatCents(lineTotalCents(price, item.quantity))}
      </div>

      <button type="button" onClick={onRemove} className={LINK_BUTTON}>
        Remove
      </button>

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
      <p className="mt-1.5 text-meta text-critical">
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
        <p className="mt-1.5 text-meta text-caution">
          Out of stock since you added it.{" "}
          <button type="button" onClick={onRemove} className="font-medium underline">
            Remove it
          </button>{" "}
          to check out.
        </p>
      );
    }

    return (
      <p className="mt-1.5 text-meta text-caution">
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
      <p className="mt-1.5 text-meta text-ink-subtle">
        Couldn't check current stock for {name}. Checkout will still be verified by the server.
      </p>
    );
  }

  return null;
}
