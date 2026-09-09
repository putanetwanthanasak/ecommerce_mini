import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowRightIcon, BagIcon } from "../components/icons";
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
      <AppLayout size="5xl">
        <h1 className="condensed text-title font-bold tracking-tight text-ink">Your cart</h1>
        <p className="mt-1 text-meta text-ink-subtle">Nothing here yet</p>
        <div className="mt-10">
          <EmptyState
            icon={<BagIcon />}
            title="Your cart is empty"
            message="Add a few things and they'll show up here."
            action={
              <Link to="/products" className={buttonClass({ variant: "primary" })}>
                Browse products
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout size="5xl">
      <h1 className="condensed text-title font-bold tracking-tight text-ink">Your cart</h1>
      <p className="mt-1 text-meta text-ink-subtle">
        {itemCount} {itemCount === 1 ? "item" : "items"}
        {isLoading && " · checking stock…"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <ul className="flex flex-col gap-4">
            {lines.map((line) => (
              <CartRow
                key={line.item.productId}
                line={line}
                onQuantityChange={(quantity) => setQuantity(line.item.productId, quantity)}
                onRemove={() => removeItem(line.item.productId)}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={clear}
            className="focus-ring mt-4 rounded-control text-meta font-medium text-ink-subtle underline-offset-4 transition hover:text-critical hover:underline"
          >
            Clear cart
          </button>
        </div>

        <aside className="surface h-fit p-6 lg:sticky lg:top-6">
          <h2 className="condensed text-row font-bold text-ink">Order summary</h2>

          <dl className="mt-4 flex flex-col gap-3 text-meta">
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Subtotal</dt>
              <dd className="figures text-ink">{formatCents(totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Shipping</dt>
              <dd className="font-medium text-signal">Free</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-hairline pt-3">
              <dt className="condensed font-bold text-ink">Total</dt>
              <dd className="figures text-row text-ink">{formatCents(totalCents)}</dd>
            </div>
          </dl>

          {/*
           * A 404'd line blocks checkout outright: the backend throws on the
           * first missing product and rolls the whole order back, so sending it
           * can only fail. Everything else — including a line that wants more
           * than the live stock — is allowed through, because that stock number
           * is a read that may already be stale and the order transaction is
           * the only place that can actually decide.
           */}
          {hasUnavailable ? (
            <>
              <button
                type="button"
                disabled
                className={buttonClass({ variant: "primary", fullWidth: true, className: "mt-6" })}
              >
                Checkout
              </button>
              <p className="mt-1.5 text-rail text-critical">Remove unavailable items first.</p>
            </>
          ) : (
            <Link
              to="/checkout"
              className={buttonClass({ variant: "primary", fullWidth: true, className: "mt-6" })}
            >
              Checkout
              <ArrowRightIcon />
            </Link>
          )}

          <Link
            to="/products"
            className="focus-ring mt-2 block rounded-control py-2 text-center text-meta font-medium text-ink-subtle transition hover:text-ink"
          >
            Continue shopping
          </Link>

          <p className="mt-4 text-rail text-ink-faint">
            Prices are confirmed by the server when you place the order.
          </p>
        </aside>
      </div>
    </AppLayout>
  );
}
