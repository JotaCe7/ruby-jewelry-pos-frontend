import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productCategoriesApi, productSubcategoriesApi } from "../../api/catalogs";
import { suppliersApi } from "../../api/contacts";
import { productsApi } from "../../api/inventory";
import type { ProductEntry } from "../../api/types";
import { useAuth } from "../auth/AuthContext";
import { MultiSelectChips } from "./MultiSelectChips";
import { ProductResults, type ViewMode } from "./ProductResults";
import { SortMenu } from "./SortMenu";
import type { SortOption } from "./types";
import { sortOptionToOrdering } from "./types";

export function FlatProductBrowser({
  viewMode,
  showOutOfStock,
  onSelectProduct,
}: {
  viewMode: ViewMode;
  showOutOfStock: boolean;
  onSelectProduct: (product: ProductEntry) => void;
}) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.isAdmin ?? false;
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]);
  const [supplierIds, setSupplierIds] = useState<number[]>([]);
  const [sort, setSort] = useState<SortOption>({ field: "name", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
  });
  const { data: subcategories } = useQuery({
    queryKey: ["product-subcategories", "all"],
    queryFn: () => productSubcategoriesApi.list(),
  });
  // Suppliers are Admin-only on the backend — a Vendedor doesn't get this
  // filter (purchasing/business-relationship data, not needed at the till).
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list(),
    enabled: isAdmin,
  });

  const visibleSubcategories = categoryIds.length
    ? subcategories?.filter((s) => categoryIds.includes(s.category))
    : subcategories;

  const { data: products, isLoading } = useQuery({
    queryKey: ["pos-products", "flat", categoryIds, subcategoryIds, supplierIds, sort, showOutOfStock],
    queryFn: () =>
      productsApi.list({
        ...(categoryIds.length && { category: categoryIds.join(",") }),
        ...(subcategoryIds.length && { subcategory: subcategoryIds.join(",") }),
        ...(supplierIds.length && { supplier: supplierIds.join(",") }),
        ordering: sortOptionToOrdering(sort),
        is_active: "true",
        ...(!showOutOfStock && { in_stock: "true" }),
      }),
  });

  const activeFilterCount = categoryIds.length + subcategoryIds.length + supplierIds.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          className="rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
          onClick={() => setShowFilters(!showFilters)}
        >
          {t("pos.filters")} {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <SortMenu value={sort} onChange={setSort} />
      </div>

      {showFilters && (
        <div className="mb-4 rounded border border-ruby-800 bg-ruby-900/50 p-3">
          <MultiSelectChips
            label={t("catalogs.category")}
            items={categories ?? []}
            selectedIds={categoryIds}
            onChange={(ids) => {
              setCategoryIds(ids);
              setSubcategoryIds((current) =>
                current.filter((id) => visibleSubcategories?.some((s) => s.id === id)),
              );
            }}
          />
          <MultiSelectChips
            label={t("catalogs.productSubcategories")}
            items={visibleSubcategories ?? []}
            selectedIds={subcategoryIds}
            onChange={setSubcategoryIds}
          />
          {isAdmin && (
            <MultiSelectChips
              label={t("finance.supplier")}
              items={suppliers ?? []}
              selectedIds={supplierIds}
              onChange={setSupplierIds}
            />
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <ProductResults products={products ?? []} viewMode={viewMode} onSelect={onSelectProduct} />
      )}
    </div>
  );
}
