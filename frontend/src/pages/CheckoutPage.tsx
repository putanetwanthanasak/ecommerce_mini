import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { AlertCircleIcon, ArrowLeftIcon, LockIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { useCart } from "../cart/cartContext";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { ProductImage } from "../catalog/ProductImage";
import { formatCents, formatPrice, lineTotalCents, sumCents } from "../lib/money";
import { toCheckoutProblem, type CheckoutProblem } from "../orders/checkoutError";
import { createOrder, orderKeys, type Order } from "../orders/ordersApi";

/**
 * Checkout — the reference's two-column layout: a shipping + payment form on the
 * left, an order summary on the right.
 *
 * THE FORM IS COSMETIC. The backend has no address field and takes no payment;
 * `POST /api/orders` still receives `{ productId, quantity }` per line (plus an
 * `Idempotency-Key` header, see below) and nothing else. The address and card
 * inputs are never read or sent — the one exception is a client-only
 * convenience: a card number ending in 0000 previews a declined-payment state
 * and stops the order, exactly as the reference mock does. Everything else about
 * placing the order — the in-flight guard, the 409 / 404 / validation handling —
 * is unchanged.
 */
export function CheckoutPage() {
  const { items, itemCount, isEmpty, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [problem, setProblem] = useState<CheckoutProblem | null>(null);
  /** Live stock for the product a 409 named, fetched after the failure. */
  const [liveStock, setLiveStock] = useState<number | null>(null);

  /** Controlled only so the 0000 decline preview can read it. Never sent. */
  const [card, setCard] = useState("");
  /** Client-only: the card ended in 0000, so we show the mock declined state. */
  const [declined, setDeclined] = useState(false);

  /*
   * One idempotency key per visit to this page. `useState`'s lazy initialiser
   * runs it once on mount; every retry from here — a re-click, or the mutation
   * firing again after an inline fix — reuses it, so the backend treats them as
   * the same attempt and never places a second order. Leaving /checkout and
   * coming back re-mounts this component and mints a new key, which is correct:
   * that is a genuinely new attempt.
   */
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  /*
   * Belt and braces against a double-click. The submit button is disabled while
   * the mutation is in flight and this ref covers the sliver before React
   * re-renders with `isPending` true — but the real guarantee against a
   * duplicate order now lives server-side, keyed on `idempotencyKey` above.
   * This just spares the user a pointless second round trip.
   */
  const inFlight = useRef(false);
  /** Set once an order exists, so the empty cart below isn't mistaken for "nothing to buy". */
  const placed = useRef(false);

  const totalCents = sumCents(items.map((item) => lineTotalCents(item.price, item.quantity)));

  const mutation = useMutation({
    mutationFn: () =>
      // Two fields per line and nothing else. No price, no total, no address,
      // no card — the backend reads price and stock off its own product rows.
      // The idempotency key rides in a header (see createOrder).
      createOrder(
        { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) },
        idempotencyKey
      ),

    onSuccess: (order: Order) => {
      placed.current = true;
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });

      clear();
      // `replace` so Back from the confirmation doesn't land on a checkout page
      // whose cart has just been emptied. `justPlaced` triggers the order page's
      // success banner (the same route is reached from history, where it's false).
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    },

    onError: async (error) => {
      const next = toCheckoutProblem(error, items);
      setProblem(next);
      setLiveStock(null);

      if (next.kind === "stock" && next.productId) {
        const productId = next.productId;
        const fresh = await queryClient
          .fetchQuery({
            queryKey: catalogKeys.product(productId),
            queryFn: () => fetchProduct(productId),
            staleTime: 0,
          })
          .catch(() => null);
        setLiveStock(fresh?.stock ?? null);
      }
    },

    onSettled: () => {
      inFlight.current = false;
    },
  });

  function placeOrder() {
    if (inFlight.current || mutation.isPending) return;
    inFlight.current = true;
    setProblem(null);
    mutation.mutate();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setDeclined(false);

    // Client-only decline preview, matching the reference. A card ending in 0000
    // never reaches the order call.
    if (card.replace(/\D/g, "").endsWith("0000") && card.replace(/\D/g, "").length >= 4) {
      setDeclined(true);
      return;
    }

    placeOrder();
  }

  if (isEmpty) {
    // The successful path empties the cart a beat before the redirect commits;
    // rendering "your cart is empty" in that gap would be a lie about what just
    // happened.
    if (placed.current) return null;

    return (
      <AppLayout size="5xl">
        <h1 className="condensed text-title font-bold tracking-tight text-ink">Checkout</h1>
        <div className="mt-10">
          <EmptyState
            title="There's nothing to check out"
            message="Your cart is empty, so there's nothing to pay for yet."
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
      <Link
        to="/cart"
        className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta font-medium text-ink-subtle transition hover:text-ink"
      >
        <ArrowLeftIcon /> Back to cart
      </Link>

      <h1 className="condensed mt-4 text-title font-bold tracking-tight text-ink">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
          {declined && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-control border border-critical-edge bg-critical-surface p-4 text-meta text-critical"
            >
              <span className="mt-0.5 shrink-0 text-base">
                <AlertCircleIcon />
              </span>
              <div>
                <p className="font-semibold">Payment failed</p>
                <p className="mt-0.5">
                  Your card was declined. Check the details or try a different card.
                </p>
              </div>
            </div>
          )}

          {problem && (
            <CheckoutProblemNotice
              problem={problem}
              liveStock={liveStock}
              error={mutation.error}
              onReduce={(productId, quantity) => {
                setQuantity(productId, quantity);
                setProblem(null);
              }}
              onRemove={(productId) => {
                removeItem(productId);
                setProblem(null);
              }}
            />
          )}

          <section className="flex flex-col gap-4">
            <h2 className="condensed text-row font-bold text-ink">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" name="firstName" defaultValue="Alex" autoComplete="given-name" />
              <FormField label="Last name" name="lastName" defaultValue="Rivera" autoComplete="family-name" />
            </div>
            <FormField label="Street address" name="address" placeholder="123 Maker St" autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <FormField label="City" name="city" placeholder="Portland" autoComplete="address-level2" />
              <FormField label="ZIP" name="zip" placeholder="97201" autoComplete="postal-code" />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="condensed text-row font-bold text-ink">Payment</h2>
            <FormField
              label="Card number"
              name="card"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Expiry" name="expiry" placeholder="MM / YY" autoComplete="cc-exp" />
              <FormField label="CVC" name="cvc" placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
            </div>
            <p className="text-xs leading-relaxed text-ink-faint">
              No payment is taken and no address is stored — these fields preview a real
              checkout. A card number ending in 0000 shows the declined state; otherwise your
              order is placed from the cart items only, and the card and address are never sent.
            </p>
          </section>

          {/*
            Disabled while the request is in flight. The backend now dedupes on
            the Idempotency-Key header (a duplicate POST returns the first order,
            it does not place a second), so this is a UX guard, not the safety
            mechanism — it stops a double-click from firing a wasted round trip.
          */}
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
            className="sm:w-fit"
          >
            <LockIcon />
            {mutation.isPending ? "Placing order…" : "Place order"}
          </Button>
        </form>

        <aside className="surface h-fit p-6 lg:sticky lg:top-6">
          <h2 className="condensed text-row font-bold text-ink">
            Order summary{" "}
            <span className="text-meta font-medium text-ink-subtle">({itemCount})</span>
          </h2>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <ProductImage
                  src={item.imageUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-control"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink-subtle">
                    Qty {item.quantity} · {formatPrice(item.price)}
                  </p>
                </div>
                <span className="figures shrink-0 text-meta text-ink">
                  {formatCents(lineTotalCents(item.price, item.quantity))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
            <span className="condensed font-bold text-ink">Total</span>
            <span className="figures text-row text-ink">{formatCents(totalCents)}</span>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}

/**
 * The failure, said in terms of what to do about it.
 *
 * Every branch here ends in an action. A checkout that dead-ends on a red
 * string leaves the user pressing the same button again.
 */
function CheckoutProblemNotice({
  problem,
  liveStock,
  error,
  onReduce,
  onRemove,
}: {
  problem: CheckoutProblem;
  liveStock: number | null;
  error: unknown;
  onReduce: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  if (problem.kind === "stock") {
    const productId = problem.productId;

    return (
      <Notice tone="caution" title={`${problem.productName} just sold out from under you`}>
        <p>
          {liveStock === null
            ? "Someone else bought it while it was in your cart."
            : liveStock === 0
              ? "There are none left."
              : `Only ${liveStock} ${liveStock === 1 ? "unit is" : "units are"} left.`}{" "}
          Nothing has been ordered and your cart is untouched.
        </p>

        {productId && liveStock !== null && (
          <div className="mt-3">
            {liveStock > 0 ? (
              <NoticeButton onClick={() => onReduce(productId, liveStock)}>
                Reduce to {liveStock} and try again
              </NoticeButton>
            ) : (
              <NoticeButton onClick={() => onRemove(productId)}>
                Remove it and try again
              </NoticeButton>
            )}
          </div>
        )}

        {!productId && (
          <p className="mt-3">
            <Link to="/cart" className="font-medium underline">
              Review your cart
            </Link>{" "}
            and lower the quantity.
          </p>
        )}
      </Notice>
    );
  }

  if (problem.kind === "missing") {
    const productId = problem.productId;

    return (
      <Notice tone="critical" title="One of these products no longer exists">
        <p>
          It was removed from the catalog while it sat in your cart. No order was placed and nothing
          was charged.
        </p>
        <div className="mt-3">
          {productId ? (
            <NoticeButton onClick={() => onRemove(productId)}>Remove it and try again</NoticeButton>
          ) : (
            <Link to="/cart" className="font-medium underline">
              Review your cart
            </Link>
          )}
        </div>
      </Notice>
    );
  }

  if (problem.kind === "validation") {
    return (
      <Notice tone="critical" title="This order can't be placed as it is">
        <ul className="list-inside list-disc space-y-1">
          {problem.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
        <p className="mt-3">
          <Link to="/cart" className="font-medium underline">
            Fix it in your cart
          </Link>
        </p>
      </Notice>
    );
  }

  if (problem.kind === "session") {
    return (
      <Notice tone="caution" title="Your session expired before the order went through">
        <p>Sign in again — your cart is saved and nothing was ordered.</p>
      </Notice>
    );
  }

  /*
   * Anything unclassified is a plain message, which is what ErrorBanner renders.
   * Note the absent `onRetry`: re-submitting is safe now (the Place order button
   * reuses one idempotency key per visit, so a retry can't double up), but that
   * button already IS the retry — a second "try again" control on the banner
   * would just be a competing affordance for the same action.
   */
  return <ErrorBanner error={error} />;
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "critical" | "caution";
  title: string;
  children: ReactNode;
}) {
  const palette =
    tone === "critical"
      ? "border-critical-edge bg-critical-surface text-critical"
      : "border-caution-edge bg-caution-surface text-caution";

  return (
    <div role="alert" className={`rounded-control border px-4 py-3 text-meta ${palette}`}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/**
 * A control sitting on one of the tinted Notice panels above. The `on-color`
 * variant borrows the panel's own text colour through currentColor.
 */
function NoticeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="on-color" size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
