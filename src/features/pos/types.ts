import type { MovementType, ProductEntry } from "../../api/types";

export interface DraftLine {
  key: string;
  product: ProductEntry;
  movementType: MovementType;
  quantity: number;
  unitPrice: string;
  useTierPrice: boolean;
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
