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
