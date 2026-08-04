import { createContext, useContext } from "react";

import type { ProductEntry } from "../../api/types";

interface CartContextValue {
  getLineQuantity: (productId: number) => number;
  incrementProduct: (product: ProductEntry) => void;
  decrementProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  // The list view shows the +/-/eliminar detail row for at most one
  // product at a time; null means every row is collapsed.
  expandedProductId: number | null;
  setExpandedProductId: (productId: number | null) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartContext.Provider");
  return context;
}
