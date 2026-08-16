import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { PageLoader } from "../components/PageLoader";
import { ApiError } from "../lib/api";
import { formatCents, formatPrice, lineTotalCents } from "../lib/money";
import { OrderStatusBadge } from "../orders/OrderStatusBadge";
import { fetchOrder, orderKeys } from "../orders/ordersApi";

const ACTION_BUTTON =
  "inline-block rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300";

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
                <Link to="/orders" className={ACTION_BUTTON}>
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
                <Link to="/orders" className={ACTION_BUTTON}>
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
        <div className="mt-6 space-y-4">
          <ErrorBanner error={query.error} />
          <button type="button" onClick={() => void query.refetch()} className={ACTION_BUTTON}>
            Try again
          </button>
        </div>
      </AppLayout>
    );
  }

  const order = query.data;

  return (
    <AppLayout>
      <BackToOrders />

      {justPlaced && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-900">Order placed</p>
          <p className="mt-1 text-sm text-emerald-800">
            Stock has been reserved for every item below.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Order details</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        <div className="bg-white p-5">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Order ID</dt>
          <dd className="mt-1.5 font-mono text-xs break-all text-slate-600">{order.id}</dd>
        </div>
        <div className="bg-white p-5">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Placed</dt>
          <dd className="mt-1.5 text-sm text-slate-900">
            <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time>
          </dd>
        </div>
      </dl>

      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-xs">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-40 flex-1">
              <Link
                to={`/products/${item.productId}`}
                className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
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
              <p className="mt-0.5 text-sm text-slate-500">
                {formatPrice(item.priceAtPurchase)} × {item.quantity}
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatCents(lineTotalCents(item.priceAtPurchase, item.quantity))}
            </div>
          </li>
        ))}

        <li className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-4">
          <span className="text-sm font-medium text-slate-700">Total</span>
          {/* The backend's own total, not a sum computed here — it is the
              authoritative number and the one that was charged. */}
          <span className="text-lg font-semibold text-slate-900">
            {formatPrice(order.totalPrice)}
          </span>
        </li>
      </ul>

      <div className="mt-6">
        <Link to="/products" className={ACTION_BUTTON}>
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
    <Link to="/orders" className="text-sm text-slate-500 hover:text-slate-900">
      ← Back to your orders
    </Link>
  );
}
