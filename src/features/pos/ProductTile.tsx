import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";

export function ProductTile({ product, onClick }: { product: ProductEntry; onClick: () => void }) {
  const { t } = useTranslation();
  const isOutOfStock = product.current_stock <= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border border-ruby-800 bg-ruby-900 text-left hover:border-ruby-500 active:scale-[0.98]"
    >
      <div
        className={`relative flex aspect-square items-center justify-center bg-ruby-950 text-blush-100/30 ${
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
          <span className={`text-3xl ${isOutOfStock ? "grayscale" : ""}`}>💎</span>
        )}
        {isOutOfStock && (
          <span className="absolute rotate-[-12deg] rounded bg-black/70 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-blush-100">
            {t("pos.soldOut")}
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blush-200">S/ {product.suggested_price}</span>
          <span className={`text-xs ${product.needs_restock ? "font-semibold text-red-400" : "text-blush-100/50"}`}>
            {t("inventory.currentStock")}: {product.current_stock}
          </span>
        </div>
      </div>
    </button>
  );
}
