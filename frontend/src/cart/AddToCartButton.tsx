import { useState } from "react";
import type { MouseEvent } from "react";
import type { Product } from "../catalog/catalogApi";
import { Button } from "../components/Button";
import { BanIcon, CheckIcon, ShoppingCartIcon } from "../components/icons";
import { useCart } from "./cartContext";

/**
 * The add-to-cart control on a catalog card, matching the reference: a primary
 * (brand) button that flips to "Added" for a beat after a click, and a disabled
 * "Sold out" secondary button with a Ban icon when stock is gone.
 *
 * Adds a single unit — quantity is chosen on the product detail page
 * (ProductPurchase) and edited in the cart. `addItem` caps at live stock, so
 * clicking past the limit is a harmless no-op.
 *
 * On the card this sits inside the stretched title-link overlay, so the click is
 * stopped from also navigating to the product.
 */
export function AddToCartButton({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  if (soldOut) {
    return (
      <Button variant="secondary" size={size} disabled aria-disabled="true">
        <BanIcon />
        Sold out
      </Button>
    );
  }

  return (
    <Button variant="primary" size={size} onClick={handleClick}>
      {added ? (
        <>
          <CheckIcon />
          Added
        </>
      ) : (
        <>
          <ShoppingCartIcon />
          Add to cart
        </>
      )}
    </Button>
  );
}
