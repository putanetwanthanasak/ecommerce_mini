import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../catalog/catalogApi";
import { CartContext, type CartContextValue } from "./cartContext";
import { addToCart, removeFromCart, setCartQuantity } from "./cartOps";
import { loadCart, saveCart } from "./cartStorage";
import { countCartItems, type CartItem } from "./cartTypes";

/**
 * The whole cart. There is no cart API on the backend — POST /api/orders takes
 * the entire basket in one payload — so this state is the cart, and localStorage
 * is the only place it is durable.
 *
 * The rules for what each mutation does live in cartOps.ts; this component is
 * the state that holds them and the storage that outlives a refresh.
 *
 * It sits outside AuthProvider's session state on purpose; see the note in
 * cartStorage.ts about surviving an expired token.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  // Read storage once, synchronously, so the first paint already has the badge
  // count right. Loading it in an effect would flash "0 items" on every refresh.
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // One effect persists every mutation, rather than each setter remembering to
  // save. A setter that forgets is a cart that looks right until the user
  // refreshes, which is a miserable bug to find.
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => addToCart(current, product, quantity));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => setCartQuantity(current, productId, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => removeFromCart(current, productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantityOf = useCallback(
    (productId: string) => items.find((item) => item.productId === productId)?.quantity ?? 0,
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: countCartItems(items),
      isEmpty: items.length === 0,
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf,
    }),
    [items, addItem, setQuantity, removeItem, clear, quantityOf]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
