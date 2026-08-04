import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";
import { useCart } from "./CartContext";

export function ProductRow({ product }: { product: ProductEntry }) {
  const { t } = useTranslation();
  const {
    getLineQuantity,
    incrementProduct,
    decrementProduct,
    removeProduct,
    expandedProductId,
    setExpandedProductId,
  } = useCart();
  const isOutOfStock = product.current_stock <= 0;
  const quantity = getLineQuantity(product.id);
  const isExpanded = expandedProductId === product.id;

  return (
    <div>
      <div
        className="flex w-full items-center gap-3 border-b border-ruby-800 px-2 py-2 text-left"
        onClick={quantity > 0 ? () => setExpandedProductId(product.id) : undefined}
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
        <div className="min-w-0 flex-1 truncate">
          <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
          <p className="truncate text-xs text-blush-100/50">{product.sku}</p>
        </div>
        <span className="whitespace-nowrap text-sm font-semibold text-blush-200">
          S/ {product.suggested_price}
        </span>
        <span className={`text-xs ${product.needs_restock ? "font-semibold text-red-400" : "text-blush-100/50"}`}>
          ({product.current_stock})
        </span>
        {quantity === 0 ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              incrementProduct(product);
              setExpandedProductId(product.id);
            }}
            className="rounded bg-ruby-600 px-3 py-1 text-sm font-medium text-blush-100 hover:bg-ruby-500"
          >
            {t("common.add")}
          </button>
        ) : (
          <span className="w-6 text-center text-sm font-semibold text-blush-100">{quantity}</span>
        )}
      </div>

      {quantity > 0 && isExpanded && (
        <div
          className="flex items-center justify-end gap-1 border-b border-ruby-800 bg-ruby-900/50 px-2 py-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => decrementProduct(product.id)}
            className="rounded border border-ruby-700 px-2 py-0.5 text-blush-100 hover:bg-ruby-800"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold text-blush-100">{quantity}</span>
          <button
            type="button"
            onClick={() => incrementProduct(product)}
            className="rounded border border-ruby-700 px-2 py-0.5 text-blush-100 hover:bg-ruby-800"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => removeProduct(product.id)}
            className="rounded border border-ruby-700 px-2 py-0.5 text-red-400 hover:bg-ruby-800"
            title={t("common.delete")}
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
