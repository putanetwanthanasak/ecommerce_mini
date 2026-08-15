import { Link } from "react-router-dom";
import { formatPrice } from "../lib/money";
import type { Product } from "./catalogApi";
import { StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      // h-full + flex-col so cards in a row match height regardless of how long
      // the name wraps, and the price line stays pinned to the bottom.
      className={`group flex h-full flex-col rounded-xl border p-5 shadow-xs transition outline-none hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-slate-300 ${
        soldOut ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
        {product.category.name}
      </p>

      <h2 className="mt-2 line-clamp-2 text-base font-medium text-slate-900 group-hover:underline">
        {product.name}
      </h2>

      {product.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{product.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</span>
        <StockBadge stock={product.stock} />
      </div>
    </Link>
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
    </div>
  );
}
