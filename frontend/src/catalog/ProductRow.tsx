import { Link } from "react-router-dom";
import { AddToCartButton } from "../cart/AddToCartButton";
import { formatPrice } from "../lib/money";
import type { Product } from "./catalogApi";
import { StockCell } from "./StockCell";

/*
 * One flap on the board.
 *
 * WHY A ROW AND NOT A CARD. This was a three-across card grid, and the grid was
 * the thing standing between the design and its own argument: prices in separate
 * columns cannot be compared. A board is rows precisely so that every figure
 * lands in one column, on one baseline, and your eye can run down it. With no
 * product photography and no column to hold any, that comparison IS the
 * shopping experience — there is nothing else to look at.
 *
 * The card also had to be tall enough for an image that never came, which is why
 * it looked unfinished. A row admits there is no picture and gets denser instead.
 *
 * The whole tile stays clickable via a stretched pseudo-element on the title
 * link, rather than wrapping everything in an <a>: a <button> inside an <a> is
 * invalid HTML and browsers disagree about which one wins the click. The add
 * control sits above that overlay on its own stacking context.
 */
export function ProductRow({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <li
      /*
       * A sold-out flap drops to the board's own colour — the row has fallen
       * blank, which is what a departures board does when a service is gone.
       *
       * The column template is what aligns the figures: name takes the slack,
       * stock and price get fixed columns, the action sits last. Below `sm` it
       * collapses to a stack, because four columns in 375px is four columns of
       * nothing.
       */
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-3 px-5 py-4 transition focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-focus sm:grid-cols-[minmax(0,1fr)_7rem_7rem_10rem] sm:items-center ${
        soldOut ? "bg-board" : "hover:bg-surface-muted"
      }`}
    >
      <div className="min-w-0">
        <h2 className="condensed line-clamp-2 text-row font-bold text-ink">
          <Link
            to={`/products/${product.id}`}
            className="outline-none after:absolute after:inset-0 group-hover:text-amber"
          >
            {product.name}
          </Link>
        </h2>

        {/*
          The category was an eyebrow above the name. It sits under it now: a tag
          on the item rather than a title for it, and it no longer pushes the two
          facts that matter down the flap.
        */}
        <p className="rail mt-1">{product.category.name}</p>

        {product.description && (
          <p className="mt-1.5 truncate text-meta text-ink-subtle">{product.description}</p>
        )}
      </div>

      {/* Order on mobile puts the price beside the name; stock follows underneath. */}
      <div className="justify-self-end text-right sm:order-3 sm:w-28">
        <span className="figures text-figure text-ink">{formatPrice(product.price)}</span>
      </div>

      <div className="sm:order-2 sm:justify-self-start">
        <StockCell stock={product.stock} />
      </div>

      {/* relative + z-10 lifts this out from under the title's click overlay. */}
      <div className="relative z-10 justify-self-end sm:order-4 sm:w-40">
        <AddToCartButton product={product} size="sm" />
      </div>
    </li>
  );
}

/**
 * A flap that has not been printed yet.
 *
 * Same box model and column template as a real row, so the switch from loading
 * to loaded doesn't reflow the board or bounce the pagination down the page.
 */
export function ProductRowSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="grid animate-pulse grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_10rem]"
    >
      <div className="min-w-0">
        <div className="h-5 w-2/5 rounded bg-skeleton" />
        <div className="mt-2 h-2.5 w-20 rounded bg-skeleton" />
        <div className="mt-2 h-3 w-3/5 rounded bg-skeleton" />
      </div>
      <div className="h-7 w-24 justify-self-end rounded bg-skeleton sm:order-3 sm:w-28" />
      <div className="h-5 w-20 rounded-control bg-skeleton sm:order-2" />
      <div className="h-8 w-28 justify-self-end rounded-control bg-skeleton sm:order-4 sm:w-40" />
    </li>
  );
}
