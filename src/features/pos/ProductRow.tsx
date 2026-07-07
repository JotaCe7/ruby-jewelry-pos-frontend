import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";

export function ProductRow({ product, onClick }: { product: ProductEntry; onClick: () => void }) {
  const { t } = useTranslation();
  const isOutOfStock = product.current_stock <= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-ruby-800 px-2 py-2 text-left hover:bg-ruby-900 active:bg-ruby-800"
    >
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-ruby-950 text-blush-100/30 ${
          product.needs_restock ? "ring-2 ring-inset ring-red-500" : ""
        }`}
      >
        {product.image ? (
          <img
            src={product.image}
            alt=""
            className={`h-full w-full object-cover ${isOutOfStock ? "grayscale" : ""}`}
          />
        ) : (
          <span className={isOutOfStock ? "grayscale" : ""}>💎</span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] font-bold uppercase text-blush-100">
            {t("pos.soldOut")}
          </span>
        )}
      </div>
      <div className="flex-1 truncate">
        <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
        <p className="truncate text-xs text-blush-100/50">{product.sku}</p>
      </div>
      <span className="whitespace-nowrap text-sm font-semibold text-blush-200">
        S/ {product.suggested_price}
      </span>
      <span className={`text-xs ${product.needs_restock ? "font-semibold text-red-400" : "text-blush-100/50"}`}>
        ({product.current_stock})
      </span>
    </button>
  );
}
