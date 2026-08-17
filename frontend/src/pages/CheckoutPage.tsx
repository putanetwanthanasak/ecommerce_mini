import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowLeftIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { useCart } from "../cart/cartContext";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { formatCents, formatPrice, lineTotalCents, sumCents } from "../lib/money";
import { toCheckoutProblem, type CheckoutProblem } from "../orders/checkoutError";
import { createOrder, orderKeys, type Order } from "../orders/ordersApi";

export function CheckoutPage() {
  const { items, isEmpty, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [problem, setProblem] = useState<CheckoutProblem | null>(null);
  /** Live stock for the product a 409 named, fetched after the failure. */
  const [liveStock, setLiveStock] = useState<number | null>(null);

  /*
   * Belt and braces against a double-click creating two orders.
   *
   * The button below is disabled while the mutation is in flight, which is the
   * real guard — a disabled button fires no click. This ref covers the sliver
   * before React has re-rendered with `isPending` true, where two clicks can
   * land in the same batch. An order is not an idempotent thing to get wrong:
   * the second one would decrement stock again and charge the customer twice.
   */
  const inFlight = useRef(false);
  /** Set once an order exists, so the empty cart below isn't mistaken for "nothing to buy". */
  const placed = useRef(false);

  const totalCents = sumCents(items.map((item) => lineTotalCents(item.price, item.quantity)));

  const mutation = useMutation({
    mutationFn: () =>
      // Two fields per line and nothing else. No price, no total — the backend
      // reads both off its own product rows inside the order transaction.
      createOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),

    onSuccess: (order: Order) => {
      placed.current = true;
      // Seed the cache so the confirmation renders the order we already have
      // instead of showing a spinner while it re-fetches what it was just told.
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      // Stock moved for every product in this order; anything cached about them
      // is now wrong.
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });

      clear();
      // `replace` so Back from the confirmation doesn't land on a checkout page
      // whose cart has just been emptied.
      //
      // `justPlaced` is what tells the order page to show its success banner.
      // The same route is reached from the history list, where "Order placed"
      // would be false, so the page cannot infer this from the URL alone.
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    },

    onError: async (error) => {
      const next = toCheckoutProblem(error, items);
      setProblem(next);
      setLiveStock(null);

      // A 409 tells us which product ran out but not how much is left. Ask, so
      // the fix can be "reduce to 1" instead of "try a smaller number".
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

  function handleConfirm() {
    if (inFlight.current || mutation.isPending) return;
    inFlight.current = true;
    setProblem(null);
    mutation.mutate();
  }

  if (isEmpty) {
    // The successful path empties the cart a beat before the redirect commits;
    // rendering "your cart is empty" in that gap would be a lie about what just
    // happened.
    if (placed.current) return null;

    return (
      <AppLayout>
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Checkout</h1>
        <div className="mt-8">
          <EmptyState
            title="There's nothing to check out"
            message="Your cart is empty."
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
      <Link to="/cart" className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta text-ink-subtle transition hover:text-ink">
        <ArrowLeftIcon /> Back to cart
      </Link>

      <h1 className="mt-6 condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Checkout</h1>

      {problem && (
        <div className="mt-6">
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
        </div>
      )}

      <ul className="surface mt-6 divide-y divide-hairline">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-40 flex-1">
              <p className="text-meta font-medium text-ink">{item.name}</p>
              <p className="mt-0.5 text-meta text-ink-subtle">
                <span className="figures">{formatPrice(item.price)}</span> × {item.quantity}
              </p>
            </div>
            <div className="figures text-meta text-ink">
              {formatCents(lineTotalCents(item.price, item.quantity))}
            </div>
          </li>
        ))}

        <li className="flex items-center justify-between gap-4 bg-surface-sunken px-5 py-4">
          <span className="text-meta font-medium text-ink-muted">Total</span>
          <span className="figures text-figure text-ink">{formatCents(totalCents)}</span>
        </li>
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
        {/*
          Disabled while the request is in flight, and that is load-bearing: the
          backend has no idempotency key, so two identical POSTs create two
          orders and decrement stock twice. This button plus the inFlight ref is
          the only thing preventing a double-click from doing that.
        */}
        <Button variant="primary" onClick={handleConfirm} disabled={mutation.isPending}>
          {mutation.isPending ? "Placing order…" : "Place order"}
        </Button>
      </div>

      <p className="mt-4 text-right text-rail text-ink-faint">
        The server confirms every price and stock level when the order is placed.
      </p>
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
    // Bound to a const so the narrowing survives into the click handlers below
    // — TypeScript drops it for a parameter's property inside a closure.
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
    // apiRequest already ended the session and ProtectedRoute is on its way to
    // /login. The one thing worth saying is that the cart isn't lost with it.
    return (
      <Notice tone="caution" title="Your session expired before the order went through">
        <p>Sign in again — your cart is saved and nothing was ordered.</p>
      </Notice>
    );
  }

  /*
   * Anything unclassified is a plain message, which is exactly what ErrorBanner
   * renders. No second copy of that markup.
   *
   * Note the absent `onRetry`. ErrorBanner can offer a one-click retry and the
   * read-only pages use it, but placing an order is not a safe thing to fire
   * again from a banner: POST /api/orders has no idempotency key, so retrying a
   * request that actually succeeded would place a second order. The Place order
   * button below, with its in-flight guard, stays the only way to try again.
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
 * A control sitting on one of the tinted Notice panels above.
 *
 * The `on-color` variant borrows the panel's own text colour through
 * currentColor rather than naming a hue, so one definition works on the red
 * and amber notices alike.
 */
function NoticeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="on-color" size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
