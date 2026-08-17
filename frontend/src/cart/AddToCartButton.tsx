import type { MouseEvent } from "react";
import type { Product } from "../catalog/catalogApi";
import { Button } from "../components/Button";
import { useCart } from "./cartContext";

/**
 * The one add-to-cart control, used from the grid card and the detail page.
 *
 * Both surfaces add a single unit; quantity is edited on the cart page. That
 * keeps one rule for what a click does — clicking twice adds two, wherever you
 * click — instead of a stepper on one page and a plain button on the other.
 */
export function AddToCartButton({ product, size = "md" }: { product: Product; size?: "sm" | "md" }) {
  const { addItem, quantityOf } = useCart();

  const inCart = quantityOf(product.id);
  const soldOut = product.stock <= 0;
  // Everything in stock is already claimed by this cart. Letting the count go
  // past it would build an order that is guaranteed to come back 409.
  const atStockLimit = !soldOut && inCart >= product.stock;
  const disabled = soldOut || atStockLimit;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // On the grid, this button sits inside a card whose title link covers the
    // whole tile. Without this, adding to the cart also navigates away from the
    // list the user was scanning.
    event.preventDefault();
    event.stopPropagation();
    addItem(product);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
      {/*
        KNOWN GAP, left for `adapt` rather than fixed here: on the grid this
        renders at `sm`, which is about 30px tall and under the 44px a thumb
        needs — inside a card whose title link covers the whole tile, so a
        mis-tap navigates away instead of doing nothing. Raising it is not a
        one-word change: the button also needs real separation from that
        overlay, and the successful add needs an announcement that is not a
        badge in a header the user has already scrolled past.
      */}
      <Button variant="primary" size={size} onClick={handleClick} disabled={disabled}>
        {soldOut ? "Out of stock" : inCart > 0 ? "Add another" : "Add to cart"}
      </Button>

      {inCart > 0 && (
        <span className="text-rail text-ink-subtle">
          {inCart} in cart
          {atStockLimit && " · all we have"}
        </span>
      )}
    </div>
  );
}
