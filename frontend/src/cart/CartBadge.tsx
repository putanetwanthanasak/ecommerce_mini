import { Link } from "react-router-dom";
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
      className="relative rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300"
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
    >
      Cart
      {itemCount > 0 && (
        <span
          // aria-hidden because the count is already in the link's label above;
          // a screen reader would otherwise read the number twice.
          aria-hidden="true"
          className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-xs font-semibold text-white"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
