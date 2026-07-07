import { createCrudApi } from "./crudFactory";
import type { NamedCatalogEntry, ProductSubcategoryEntry } from "./types";

export const expenseCategoriesApi = createCrudApi<NamedCatalogEntry>("/catalogs/expense-categories/");
export const paymentMethodsApi = createCrudApi<NamedCatalogEntry>("/catalogs/payment-methods/");
export const productCategoriesApi = createCrudApi<NamedCatalogEntry>("/catalogs/product-categories/");
export const colorVariantsApi = createCrudApi<NamedCatalogEntry>("/catalogs/colors/");
export const presentationsApi = createCrudApi<NamedCatalogEntry>("/catalogs/presentations/");

export const productSubcategoriesApi = createCrudApi<
  ProductSubcategoryEntry,
  { name: string; category: number; is_active: boolean }
>("/catalogs/product-subcategories/");
