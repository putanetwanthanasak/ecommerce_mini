import { Link } from "react-router-dom";
import { AddToCartButton } from "../cart/AddToCartButton";
import { formatPrice } from "../lib/money";
import type { Product } from "./catalogApi";
import { ProductImage } from "./ProductImage";
import { StockBadge } from "./StockBadge";

/*
 * One product per card, in a grid.
 *
 * THIS REPLACED A ROW LAYOUT. The list row was built for a catalog with no
 * photography — it argued, correctly for its time, that a row keeps every price
 * in one column where prices can be compared, and that a card with an empty
 * image slot looks unfinished. `Product.imageUrl` exists now and the catalog
 * ships real images, so the premise is gone: showing the product is the job, and
 * a card is what puts the image first. See the SUPERSEDED note in DESIGN.md.
 *
 * Anatomy, top to bottom: a square image with the stock badge in its corner,
 * then the category as an eyebrow, the name, and a price / add-to-cart row.
 *
 * The whole card is clickable through a stretched pseudo-element on the name
 * link (`after:absolute after:inset-0`, resolving against the `relative` <li>),
 * rather than wrapping the card in an <a>: a <button> inside an <a> is invalid
 * HTML. The image is its own link for the same destination; the add control is
 * lifted above the overlay on its own stacking context.
 */
export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <li className="group surface card-interactive relative flex flex-col overflow-hidden focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-focus">
      <Link
        to={`/products/${product.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block overflow-hidden"
      >
        <ProductImage
          src={product.imageUrl}
          alt=""
          className={`aspect-square w-full transition-transform duration-300 group-hover:scale-[1.03] ${
            soldOut ? "opacity-70 saturate-50" : ""
          }`}
        />
        <div className="absolute top-3 left-3 z-10">
          <StockBadge stock={product.stock} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {/* The category is a tag on the item, not a title for it — an eyebrow
            above the name here only because a card has the vertical room the row
            didn't. */}
        <p className="rail">{product.category.name}</p>

        <h2 className="condensed text-row leading-snug font-semibold text-balance text-ink">
          <Link
            to={`/products/${product.id}`}
            className="outline-none after:absolute after:inset-0 group-hover:text-brand"
          >
            {product.name}
          </Link>
        </h2>

        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="figures text-xl leading-none text-ink">{formatPrice(product.price)}</span>

          {/* relative + z-10 lifts this out from under the name link's overlay. */}
          <div className="relative z-10">
            <AddToCartButton product={product} size="sm" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * A card whose content has not loaded yet.
 *
 * Same outer box — `surface`, the square image area, the same padding — as a
 * real card, so the switch from loading to loaded doesn't reflow the grid or
 * bounce the pagination down the page.
 */
export function ProductCardSkeleton() {
  return (
    <li aria-hidden="true" className="surface flex animate-pulse flex-col overflow-hidden">
      <div className="aspect-square w-full bg-skeleton" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-2.5 w-16 rounded bg-skeleton" />
        <div className="h-4 w-3/4 rounded bg-skeleton" />
        <div className="mt-3 flex items-center justify-between">
          <div className="h-6 w-16 rounded bg-skeleton" />
          <div className="h-8 w-20 rounded-control bg-skeleton" />
        </div>
      </div>
    </li>
  );
}
