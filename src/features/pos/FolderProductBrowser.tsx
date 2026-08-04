import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productCategoriesApi, productSubcategoriesApi } from "../../api/catalogs";
import { productsApi } from "../../api/inventory";
import { FolderResults } from "./FolderResults";
import { ProductResults, type ViewMode } from "./ProductResults";
import { SortMenu } from "./SortMenu";
import type { SortOption } from "./types";
import { sortOptionToOrdering } from "./types";
import { usePersistedState } from "./usePersistedState";

export function FolderProductBrowser({
  viewMode,
  showOutOfStock,
}: {
  viewMode: ViewMode;
  showOutOfStock: boolean;
}) {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = usePersistedState<number | null>("pos.browse.folder.categoryId", null);
  const [categoryName, setCategoryName] = usePersistedState("pos.browse.folder.categoryName", "");
  const [subcategoryId, setSubcategoryId] = usePersistedState<number | null>(
    "pos.browse.folder.subcategoryId",
    null,
  );
  const [subcategoryName, setSubcategoryName] = usePersistedState("pos.browse.folder.subcategoryName", "");
  const [sort, setSort] = usePersistedState<SortOption>("pos.browse.folder.sort", {
    field: "name",
    direction: "asc",
  });

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
    enabled: !categoryId,
  });

  const { data: subcategories } = useQuery({
    queryKey: ["product-subcategories", categoryId],
    queryFn: () => productSubcategoriesApi.list({ category: categoryId! }),
    enabled: !!categoryId && !subcategoryId,
  });

  const { data: products } = useQuery({
    queryKey: ["pos-products", "folder", subcategoryId, sort, showOutOfStock],
    queryFn: () =>
      productsApi.list({
        subcategory: subcategoryId!,
        ordering: sortOptionToOrdering(sort),
        is_active: "true",
        ...(!showOutOfStock && { in_stock: "true" }),
      }),
    enabled: !!subcategoryId,
  });

  function goToRoot() {
    setCategoryId(null);
    setSubcategoryId(null);
  }

  function goToCategory() {
    setSubcategoryId(null);
  }

  return (
    <div>
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-blush-100/70">
        <button className="hover:text-blush-200" onClick={goToRoot}>
          {t("pos.allCategories")}
        </button>
        {categoryId && (
          <>
            <span>/</span>
            <button
              className={subcategoryId ? "hover:text-blush-200" : "font-semibold text-blush-200"}
              onClick={goToCategory}
            >
              {categoryName}
            </button>
          </>
        )}
        {subcategoryId && (
          <>
            <span>/</span>
            <span className="font-semibold text-blush-200">{subcategoryName}</span>
          </>
        )}
      </nav>

      {subcategoryId && (
        <div className="mb-3 flex justify-end">
          <SortMenu value={sort} onChange={setSort} />
        </div>
      )}

      {!categoryId && (
        <FolderResults
          items={categories ?? []}
          viewMode={viewMode}
          onSelect={(item) => {
            setCategoryId(item.id);
            setCategoryName(item.name);
          }}
        />
      )}

      {categoryId && !subcategoryId && (
        <FolderResults
          items={subcategories ?? []}
          viewMode={viewMode}
          onSelect={(item) => {
            setSubcategoryId(item.id);
            setSubcategoryName(item.name);
          }}
        />
      )}

      {subcategoryId && (
        <ProductResults products={products ?? []} viewMode={viewMode} />
      )}
    </div>
  );
}
