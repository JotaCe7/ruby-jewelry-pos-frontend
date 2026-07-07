import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productCategoriesApi, productSubcategoriesApi } from "../../api/catalogs";
import { productsApi } from "../../api/inventory";
import type { ProductEntry } from "../../api/types";
import { FolderResults } from "./FolderResults";
import { ProductResults, type ViewMode } from "./ProductResults";
import { SortMenu } from "./SortMenu";
import type { SortOption } from "./types";
import { sortOptionToOrdering } from "./types";

export function FolderProductBrowser({
  viewMode,
  onSelectProduct,
}: {
  viewMode: ViewMode;
  onSelectProduct: (product: ProductEntry) => void;
}) {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [sort, setSort] = useState<SortOption>({ field: "name", direction: "asc" });

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
    queryKey: ["pos-products", "folder", subcategoryId, sort],
    queryFn: () =>
      productsApi.list({ subcategory: subcategoryId!, ordering: sortOptionToOrdering(sort) }),
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
        <ProductResults products={products ?? []} viewMode={viewMode} onSelect={onSelectProduct} />
      )}
    </div>
  );
}
