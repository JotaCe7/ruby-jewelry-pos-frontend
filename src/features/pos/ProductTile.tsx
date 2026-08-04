import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";
import { useCart } from "./CartContext";

export function ProductTile({ product }: { product: ProductEntry }) {
  const { t } = useTranslation();
  const { getLineQuantity, incrementProduct, decrementProduct, removeProduct } = useCart();
  const isOutOfStock = product.current_stock <= 0;
  const quantity = getLineQuantity(product.id);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-ruby-800 bg-ruby-900 text-left">
      <button
        type="button"
        onClick={() => incrementProduct(product)}
        className="relative flex aspect-square items-center justify-center bg-ruby-950 text-blush-100/30 hover:opacity-90 active:scale-[0.98]"
      >
        <div
          className={`absolute inset-0 flex items-center justify-center ${
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
        </div>
        {isOutOfStock && (
          <span className="absolute rotate-[-12deg] rounded bg-black/70 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-blush-100">
            {t("pos.soldOut")}
          </span>
        )}
      </button>
      <div className="p-2">
        <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blush-200">S/ {product.suggested_price}</span>
          <span className={`text-xs ${product.needs_restock ? "font-semibold text-red-400" : "text-blush-100/50"}`}>
            {t("inventory.currentStock")}: {product.current_stock}
          </span>
        </div>
        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => incrementProduct(product)}
            className="mt-2 w-full rounded bg-ruby-600 py-1 text-sm font-medium text-blush-100 hover:bg-ruby-500"
          >
            {t("common.add")}
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => decrementProduct(product.id)}
              className="rounded border border-ruby-700 px-2 py-1 text-blush-100 hover:bg-ruby-800"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-blush-100">{quantity}</span>
            <button
              type="button"
              onClick={() => incrementProduct(product)}
              className="rounded border border-ruby-700 px-2 py-1 text-blush-100 hover:bg-ruby-800"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => removeProduct(product.id)}
              className="rounded border border-ruby-700 px-2 py-1 text-red-400 hover:bg-ruby-800"
              title={t("common.delete")}
            >
              🗑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
