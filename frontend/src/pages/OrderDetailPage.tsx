import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowLeftIcon, CheckCircleIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { PageLoader } from "../components/PageLoader";
import { ProductImage } from "../catalog/ProductImage";
import { ApiError } from "../lib/api";
import { formatCents, formatPrice, lineTotalCents } from "../lib/money";
import { countOrderItems, shortOrderId } from "../orders/orderDisplay";
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
        <AppLayout size="3xl">
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
        <AppLayout size="3xl">
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
      <AppLayout size="3xl">
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
  const itemCount = countOrderItems(order);

  return (
    <AppLayout size="3xl">
      <BackToOrders />

      {justPlaced && (
        <div className="mt-6 flex items-center gap-4 rounded-panel border border-positive-edge bg-positive-surface p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-signal text-xl text-brand-foreground">
            <CheckCircleIcon />
          </span>
          <div>
            <h1 className="condensed text-row font-bold tracking-tight text-signal">Order confirmed</h1>
            <p className="text-meta text-ink-subtle">
              Your order has been placed and stock reserved for every item below.
            </p>
          </div>
        </div>
      )}

      <div className="surface mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-5">
          <div>
            <p className="rail">Order</p>
            <p className="figures mt-0.5 text-row text-ink">#{shortOrderId(order.id)}</p>
            <p className="mt-1 text-meta text-ink-subtle">
              Placed{" "}
              <time dateTime={order.createdAt}>
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <ul className="flex flex-col divide-y divide-hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {/* The product's current catalog image; a neutral block when it's
                  null or the URL fails to load. */}
              <ProductImage
                src={item.product.imageUrl}
                alt=""
                className="size-16 shrink-0 rounded-control"
              />

              <div className="min-w-0 flex-1">
                <h2 className="condensed leading-snug font-semibold text-ink">
                  <Link
                    to={`/products/${item.productId}`}
                    className="focus-ring rounded-control transition hover:text-brand"
                  >
                    {item.product.name}
                  </Link>
                </h2>
                {/*
                 * priceAtPurchase, NOT product.price — the price the customer
                 * actually paid, copied onto the order row inside the transaction
                 * that placed it. Rendering today's product.price here would
                 * silently rewrite the receipt: the total below would stop
                 * matching the lines, and a repriced product would show a number
                 * nobody was ever charged.
                 */}
                <p className="mt-0.5 text-meta text-ink-subtle">
                  <span className="figures">{formatPrice(item.priceAtPurchase)}</span> ×{" "}
                  {item.quantity}
                </p>
              </div>

              <span className="figures shrink-0 text-row text-ink">
                {formatCents(lineTotalCents(item.priceAtPurchase, item.quantity))}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-hairline pt-5">
          <span className="text-meta text-ink-subtle">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-meta text-ink-subtle">Total</span>
            {/* The backend's own total, not re-derived from today's prices. */}
            <span className="figures text-figure text-ink">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
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
