import type { MovementType, ProductEntry } from "../../api/types";

export interface DraftLine {
  key: string;
  product: ProductEntry;
  movementType: MovementType;
  quantity: number;
  unitPrice: string;
  useTierPrice: boolean;
  usePackPrice: boolean;
  discount: string;
  comboKey: string | null;
}

export type SortField = "name" | "price" | "stock" | "cost";
export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export const SORT_TO_ORDERING: Record<SortField, string> = {
  name: "base_model",
  price: "suggested_price",
  stock: "current_stock",
  cost: "unit_cost",
};

export function sortOptionToOrdering(sort: SortOption): string {
  const field = SORT_TO_ORDERING[sort.field];
  return sort.direction === "desc" ? `-${field}` : field;
}

export function applicableUnitPrice(product: ProductEntry, quantity: number): string {
  const applicableTier = product.price_tiers
    .filter((tier) => tier.min_quantity <= quantity)
    .sort((a, b) => b.min_quantity - a.min_quantity)[0];
  return applicableTier ? applicableTier.unit_price : product.suggested_price;
}

// A pack promo ("2 for S/15") is applied as a discount on the normal unit
// price, not as an override of it, so it stacks cleanly with the flat
// suggested_price and avoids splitting a line into a fractional unit
// price when the quantity isn't an exact multiple of the pack size.
export function packPriceDiscount(product: ProductEntry, quantity: number): string {
  const pack = product.pack_price;
  if (!pack) return "0.00";
  const fullPacks = Math.floor(quantity / pack.pack_quantity);
  if (fullPacks === 0) return "0.00";
  const savingsPerPack = pack.pack_quantity * Number(product.suggested_price) - Number(pack.pack_price);
  return Math.max(0, fullPacks * savingsPerPack).toFixed(2);
}
