import { createContext, useContext } from "react";
import type { Product } from "../catalog/catalogApi";
import type { CartItem } from "./cartTypes";

export interface CartContextValue {
  items: CartItem[];
  /** Total units, not lines — 3 of one product counts as 3. */
  itemCount: number;
  isEmpty: boolean;
  /** Adds `quantity` units; an item already in the cart is incremented, not duplicated. */
  addItem: (product: Product, quantity?: number) => void;
  /** Sets an absolute quantity. 0 or less removes the line. */
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  /** Units of this product already in the cart; 0 if it isn't there. */
  quantityOf: (productId: string) => number;
}

// Split from CartProvider.tsx for the same reason authContext is split from
// AuthProvider: a module that exports both a component and a hook breaks Fast
// Refresh.
export const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
