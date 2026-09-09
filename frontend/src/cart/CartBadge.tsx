import { Link } from "react-router-dom";
import { buttonClass } from "../components/buttonStyles";
import { BagIcon } from "../components/icons";
import { useCart } from "./cartContext";

/**
 * Header link to the cart: a bag glyph, the word, and the unit count in a
 * bubble. It is the header's one filled control — the primary thing a shopper
 * does from any page is go to their cart — so it takes the primary treatment
 * while Orders and Log out stay quiet beside it.
 *
 * Counts units rather than lines: after adding the same product three times a
 * badge reading "1" looks like two of the clicks were lost.
 */
export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      to="/cart"
      className={buttonClass({ variant: "primary", size: "sm", className: "relative" })}
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
    >
      <BagIcon />
      Cart
      {itemCount > 0 && (
        <span
          // aria-hidden because the count is already in the link's label above;
          // a screen reader would otherwise read the number twice.
          aria-hidden="true"
          className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-foreground px-1.5 py-0.5 text-rail font-semibold text-brand"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
