import { apiClient } from "./client";
import { createCrudApi } from "./crudFactory";
import type {
  InventoryAuditEntry,
  InventoryAuditWritePayload,
  InventoryDamageEntry,
  InventoryDamageWritePayload,
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

// Replaces (not merges) each target's tier set with the source's.
export async function copyPriceTiers(sourceProductId: number, targetProductIds: number[]) {
  await apiClient.post("/inventory/price-tiers/copy/", {
    source_product: sourceProductId,
    target_products: targetProductIds,
  });
}
export const inventoryEntriesApi = createCrudApi<InventoryEntryEntry, InventoryEntryWritePayload>(
  "/inventory/entries/",
);
export const inventoryAuditsApi = createCrudApi<InventoryAuditEntry, InventoryAuditWritePayload>(
  "/inventory/audits/",
);
export const inventoryDamagesApi = createCrudApi<InventoryDamageEntry, InventoryDamageWritePayload>(
  "/inventory/damages/",
);

// Read-only hint for the create form. The actual code is only ever
// assigned for real by the backend at save time (see
// inventory.services.preview_next_product_code), never reserves anything.
export async function previewProductCode(subcategoryId: number) {
  const { data } = await apiClient.get<{ code: string }>("/inventory/products/preview_code/", {
    params: { subcategory: subcategoryId },
  });
  return data.code;
}
