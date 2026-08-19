import { Link } from "react-router-dom";
import { buttonClass } from "../components/buttonStyles";
import { useCart } from "./cartContext";

/**
 * Header link to the cart, with the unit count.
 *
 * Counts units rather than lines: after adding the same product three times a
 * badge reading "1" looks like two of the clicks were lost.
 */
export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      to="/cart"
      className={buttonClass({ size: "sm", className: "relative" })}
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
    >
      Cart
      {itemCount > 0 && (
        <span
          // aria-hidden because the count is already in the link's label above;
          // a screen reader would otherwise read the number twice.
          aria-hidden="true"
          className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-1.5 py-0.5 text-rail font-semibold text-board"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
