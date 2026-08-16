import type { MouseEvent } from "react";
import type { Product } from "../catalog/catalogApi";
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

  const padding = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`rounded-lg bg-slate-900 font-medium text-white transition outline-none hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 ${padding}`}
      >
        {soldOut ? "Out of stock" : inCart > 0 ? "Add another" : "Add to cart"}
      </button>

      {inCart > 0 && (
        <span className="text-xs text-slate-500">
          {inCart} in cart
          {atStockLimit && " · all we have"}
        </span>
      )}
    </div>
  );
}
