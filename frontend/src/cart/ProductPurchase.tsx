import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../catalog/catalogApi";
import { Button } from "../components/Button";
import { BanIcon, CheckIcon, ShoppingCartIcon } from "../components/icons";
import { useCart } from "./cartContext";
import { QuantityStepper } from "./QuantityStepper";

/**
 * The buy control on the product detail page, matching the reference: a quantity
 * stepper and an "Add to cart" button that adds that many units and flips to
 * "Added to cart" for a beat. Sold out shows a disabled button and a pointer
 * back to the catalog.
 *
 * Quantity lives here only — the catalog card adds one at a time
 * (AddToCartButton), and the cart page edits amounts after the fact.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  if (soldOut) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="secondary" disabled aria-disabled="true" className="w-full sm:w-fit">
          <BanIcon />
          Sold out
        </Button>
        <p className="text-meta text-ink-subtle">
          This item is currently unavailable.{" "}
          <Link
            to="/products"
            className="focus-ring rounded-control font-medium text-brand underline-offset-4 hover:underline"
          >
            Browse other products
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink">Quantity</span>
        <QuantityStepper
          quantity={quantity}
          max={Math.max(product.stock, 1)}
          label={product.name}
          onChange={setQuantity}
        />
      </div>

      <Button variant="primary" onClick={handleAdd} className="w-full sm:w-fit">
        {added ? (
          <>
            <CheckIcon />
            Added to cart
          </>
        ) : (
          <>
            <ShoppingCartIcon />
            Add to cart
          </>
        )}
      </Button>
    </div>
  );
}
