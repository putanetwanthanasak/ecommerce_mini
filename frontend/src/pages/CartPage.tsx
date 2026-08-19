import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { useCart } from "../cart/cartContext";
import { CartRow } from "../cart/CartRow";
import { useCartLines } from "../cart/useCartLines";
import { formatCents, lineTotalCents, sumCents } from "../lib/money";

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
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Your cart</h1>
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            message="Browse the catalog and add something to get started."
            action={
              <Link to="/products" className={buttonClass()}>
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
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Your cart</h1>
        <p className="text-meta text-ink-subtle">
          {itemCount} {itemCount === 1 ? "item" : "items"}
          {isLoading && " · checking stock…"}
        </p>
      </div>

      <ul className="surface mt-6 divide-y divide-hairline">
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
        <Button onClick={clear}>Clear cart</Button>

        <div className="flex flex-wrap items-center gap-5">
          <div className="text-right">
            <p className="text-rail font-medium tracking-wide text-ink-subtle uppercase">Total</p>
            <p className="figures text-figure text-ink">{formatCents(totalCents)}</p>
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
              <Button variant="primary" disabled>
                Checkout
              </Button>
              <p className="mt-1.5 text-rail text-critical">Remove unavailable items first.</p>
            </div>
          ) : (
            <Link to="/checkout" className={buttonClass({ variant: "primary" })}>
              Checkout
            </Link>
          )}
        </div>
      </div>

      <p className="mt-4 text-rail text-ink-faint">
        Prices are confirmed by the server when you place the order.
      </p>
    </AppLayout>
  );
}
