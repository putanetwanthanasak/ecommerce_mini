import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { useCart } from "../cart/cartContext";
import { CartRow } from "../cart/CartRow";
import { useCartLines } from "../cart/useCartLines";
import { formatCents, lineTotalCents, sumCents } from "../lib/money";

const ACTION_BUTTON =
  "inline-block rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300";

export function CartPage() {
  const { items, itemCount, isEmpty, setQuantity, removeItem, clear } = useCart();

  // Re-checks every product against the catalog on mount. The cart's stored
  // stock and price can be days old; see useCartLines.
  const { lines, isLoading, hasUnavailable } = useCartLines(items);

  // Totalled from the live price where the re-fetch supplied one. Still only a
  // preview — the backend recomputes every line when the order is placed.
  const totalCents = sumCents(
    lines.map((line) => lineTotalCents(line.price, line.item.quantity))
  );

  if (isEmpty) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your cart</h1>
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            message="Browse the catalog and add something to get started."
            action={
              <Link to="/products" className={ACTION_BUTTON}>
                Browse products
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your cart</h1>
        <p className="text-sm text-slate-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
          {isLoading && " · checking stock…"}
        </p>
      </div>

      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-xs">
        {lines.map((line) => (
          <CartRow
            key={line.item.productId}
            line={line}
            onQuantityChange={(quantity) => setQuantity(line.item.productId, quantity)}
            onRemove={() => removeItem(line.item.productId)}
          />
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={clear} className={ACTION_BUTTON}>
          Clear cart
        </button>

        <div className="flex flex-wrap items-center gap-5">
          <div className="text-right">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Total</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCents(totalCents)}</p>
          </div>

          {/*
           * A 404'd line blocks checkout outright: the backend throws on the
           * first missing product and rolls the whole order back, so sending it
           * can only fail. Everything else — including a line that wants more
           * than the live stock — is allowed through, because the stock number
           * here is a read that may already be stale and the order transaction
           * is the only place that can actually decide. Checkout handles the
           * 409 if it loses that race.
           */}
          {hasUnavailable ? (
            <div className="text-right">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-slate-300 px-5 py-2.5 text-sm font-medium text-white"
              >
                Checkout
              </button>
              <p className="mt-1.5 text-xs text-red-700">Remove unavailable items first.</p>
            </div>
          ) : (
            <Link
              to="/checkout"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition outline-none hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Checkout
            </Link>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Prices are confirmed by the server when you place the order.
      </p>
    </AppLayout>
  );
}
