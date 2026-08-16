import { Link } from "react-router-dom";
import { AddToCartButton } from "../cart/AddToCartButton";
import { formatPrice } from "../lib/money";
import type { Product } from "./catalogApi";
import { StockBadge } from "./StockBadge";

/*
 * The card used to be a single <Link> wrapping everything. Adding a cart button
 * changed that: a <button> inside an <a> is invalid HTML, and browsers resolve
 * the ambiguity differently — some navigate on the click, some don't.
 *
 * So the card is a plain container, and the title link stretches an absolutely
 * positioned pseudo-element over it to keep the whole tile clickable. The
 * button sits above that overlay on its own stacking context, which is why it
 * can be clicked without navigating.
 */
export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <div
      // h-full + flex-col so cards in a row match height regardless of how long
      // the name wraps, and the price line stays pinned to the bottom.
      className={`group relative flex h-full flex-col rounded-xl border p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm focus-within:ring-2 focus-within:ring-slate-300 ${
        soldOut ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
        {product.category.name}
      </p>

      <h2 className="mt-2 line-clamp-2 text-base font-medium text-slate-900">
        <Link
          to={`/products/${product.id}`}
          className="outline-none after:absolute after:inset-0 after:rounded-xl group-hover:underline"
        >
          {product.name}
        </Link>
      </h2>

      {product.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{product.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</span>
        <StockBadge stock={product.stock} />
      </div>

      {/* relative + z-10 lifts this out from under the title's click overlay. */}
      <div className="relative z-10 pt-3">
        <AddToCartButton product={product} size="sm" />
      </div>
    </div>
  );
}

/**
 * Same box model as a real card, so switching between loading and loaded
 * doesn't reflow the grid or bounce the pagination controls down the page.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="h-3 w-20 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="h-6 w-20 rounded bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-3 h-8 w-28 rounded-lg bg-slate-100" />
    </div>
  );
}
