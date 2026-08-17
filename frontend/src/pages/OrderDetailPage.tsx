import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowLeftIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { PageLoader } from "../components/PageLoader";
import { ApiError } from "../lib/api";
import { formatCents, formatPrice, lineTotalCents } from "../lib/money";
import { OrderStatusBadge } from "../orders/OrderStatusBadge";
import { fetchOrder, orderKeys } from "../orders/ordersApi";

/** Set by checkout on the navigation that lands here; see the banner below. */
interface OrderDetailLocationState {
  justPlaced?: boolean;
}

/**
 * One order, at /orders/:id.
 *
 * This is the same page whether checkout just redirected here or the customer
 * opened it from their history a month later — one component, one fetch, one
 * layout. It was the checkout confirmation first, which is why it is worth
 * being explicit that it is no longer only that: everything below the banner
 * describes the order as it stands, and none of it assumes the order is new.
 *
 * The single concession to arriving from checkout is the success banner, which
 * renders only when checkout set `justPlaced` on the navigation. That flag has
 * to exist. "Order placed — stock has been reserved" is true for exactly one
 * moment, and printing it above a month-old CANCELLED order would be plainly
 * false; dropping it entirely would mean a customer finishes paying and gets no
 * confirmation that anything happened.
 */
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justPlaced = (location.state as OrderDetailLocationState | null)?.justPlaced === true;

  /*
   * The order is fetched rather than handed over through navigation state, even
   * though checkout has it in memory a moment earlier. That is what makes this
   * URL a real page: refresh it, bookmark it, open it tomorrow and it still
   * works. Checkout seeds this exact query key on success, so the common path
   * paints immediately and this request is just the thing that keeps it honest.
   */
  const query = useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => fetchOrder(id as string),
    enabled: Boolean(id),
  });

  if (query.isPending) return <PageLoader label="Loading your order" />;

  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : null;

    /*
     * 403 and 404 are different facts and get different words.
     *
     * A 403 means the order exists and belongs to somebody else — the token is
     * perfectly valid, so this must not read as a session problem and must not
     * sign anyone out. apiRequest already guarantees the second part (frontend
     * invariant 1); saying "not found" here would undo the first by implying
     * the URL is wrong when it isn't.
     */
    if (status === 403) {
      return (
        <AppLayout>
          <BackToOrders />
          <div className="mt-6">
            <EmptyState
              title="You don't have access to this order"
              message="This order belongs to a different account. You're still signed in — only orders you placed yourself appear in your history."
              action={
                <Link to="/orders" className={buttonClass()}>
                  Go to your orders
                </Link>
              }
            />
          </div>
        </AppLayout>
      );
    }

    if (status === 404) {
      return (
        <AppLayout>
          <BackToOrders />
          <div className="mt-6">
            <EmptyState
              title="Order not found"
              message="No order exists with this id. The link may be mistyped or out of date."
              action={
                <Link to="/orders" className={buttonClass()}>
                  Go to your orders
                </Link>
              }
            />
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <BackToOrders />
        <div className="mt-6">
          <ErrorBanner
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        </div>
      </AppLayout>
    );
  }

  const order = query.data;

  return (
    <AppLayout>
      <BackToOrders />

      {justPlaced && (
        <div className="mt-6 rounded-panel border border-positive-edge bg-positive-surface px-5 py-4">
          <p className="text-meta font-semibold text-positive">Order placed</p>
          <p className="mt-1 text-meta text-positive">
            Stock has been reserved for every item below.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Order details</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-4 hairline-grid sm:grid-cols-2">
        <div className="bg-surface p-5">
          <dt className="text-rail font-medium tracking-wide text-ink-subtle uppercase">Order ID</dt>
          <dd className="mt-1.5 font-mono text-rail break-all text-ink-muted">{order.id}</dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-rail font-medium tracking-wide text-ink-subtle uppercase">Placed</dt>
          <dd className="mt-1.5 text-meta text-ink">
            <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time>
          </dd>
        </div>
      </dl>

      <ul className="mt-6 divide-y divide-hairline surface">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-40 flex-1">
              <Link
                to={`/products/${item.productId}`}
                className="condensed text-row font-bold text-ink underline-offset-4 hover:text-amber hover:underline"
              >
                {item.product.name}
              </Link>
              {/*
               * priceAtPurchase, NOT product.price.
               *
               * This is the price the customer actually paid, copied onto the
               * order row inside the transaction that placed it. product.price
               * is whatever the product costs right now, and the two diverge the
               * moment an admin reprices anything. Rendering the live price here
               * would silently rewrite the customer's receipt — the total below
               * would stop matching the lines, and an order from last month
               * would show a number nobody was ever charged. This matters more
               * now than it did at checkout: history is exactly where the two
               * prices have had time to drift apart.
               */}
              <p className="mt-0.5 text-meta text-ink-subtle">
                <span className="figures">{formatPrice(item.priceAtPurchase)}</span> × {item.quantity}
              </p>
            </div>
            <div className="figures text-meta text-ink">
              {formatCents(lineTotalCents(item.priceAtPurchase, item.quantity))}
            </div>
          </li>
        ))}

        <li className="flex items-center justify-between gap-4 bg-surface-sunken px-5 py-4">
          <span className="text-meta font-medium text-ink-muted">Total</span>
          {/* The backend's own total, not a sum computed here — it is the
              authoritative number and the one that was charged. */}
          <span className="figures text-figure text-ink">
            {formatPrice(order.totalPrice)}
          </span>
        </li>
      </ul>

      <div className="mt-6">
        <Link to="/products" className={buttonClass()}>
          Continue shopping
        </Link>
      </div>
    </AppLayout>
  );
}

/**
 * Rendered at a fixed position in every state — loaded, 403, 404, failed — so
 * there is always the same way back, including from the states where the order
 * itself never arrived.
 */
function BackToOrders() {
  return (
    <Link to="/orders" className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta text-ink-subtle transition hover:text-ink">
      <ArrowLeftIcon /> Back to your orders
    </Link>
  );
}
