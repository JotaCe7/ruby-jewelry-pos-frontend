import { createCrudApi } from "./crudFactory";
import type {
  InventoryAuditEntry,
  InventoryAuditWritePayload,
  InventoryEntryEntry,
  InventoryEntryWritePayload,
  PriceTierEntry,
  ProductEntry,
  ProductWritePayload,
} from "./types";

export const productsApi = createCrudApi<ProductEntry, ProductWritePayload>("/inventory/products/");
export const priceTiersApi = createCrudApi<
  PriceTierEntry,
  { product: number; min_quantity: number; unit_price: string }
>("/inventory/price-tiers/");
export const inventoryEntriesApi = createCrudApi<InventoryEntryEntry, InventoryEntryWritePayload>(
  "/inventory/entries/",
);
export const inventoryAuditsApi = createCrudApi<InventoryAuditEntry, InventoryAuditWritePayload>(
  "/inventory/audits/",
);
