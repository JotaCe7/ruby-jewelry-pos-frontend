import { apiClient } from "./client";
import { createCrudApi } from "./crudFactory";
import type {
  NamedCatalogEntry,
  PaymentMethodEntry,
  ProductCategoryEntry,
  ProductSubcategoryEntry,
} from "./types";

export const expenseCategoriesApi = createCrudApi<NamedCatalogEntry>("/catalogs/expense-categories/");
export const paymentMethodsApi = createCrudApi<PaymentMethodEntry>("/catalogs/payment-methods/");
export const productCategoriesApi = createCrudApi<ProductCategoryEntry>("/catalogs/product-categories/");
export const colorVariantsApi = createCrudApi<NamedCatalogEntry>("/catalogs/colors/");
export const presentationsApi = createCrudApi<NamedCatalogEntry>("/catalogs/presentations/");

export const productSubcategoriesApi = createCrudApi<
  ProductSubcategoryEntry,
  { name: string; category: number; is_active: boolean }
>("/catalogs/product-subcategories/");

// Read-only hints for the create forms. The actual code is only ever
// assigned for real by the backend at save time (see
// catalogs.services.preview_next_*), these never reserve anything.
export async function previewCategoryCode() {
  const { data } = await apiClient.get<{ code: string }>("/catalogs/product-categories/preview_code/");
  return data.code;
}

export async function previewSubcategoryCode(categoryId: number) {
  const { data } = await apiClient.get<{ code: string }>(
    "/catalogs/product-subcategories/preview_code/",
    { params: { category: categoryId } },
  );
  return data.code;
}
