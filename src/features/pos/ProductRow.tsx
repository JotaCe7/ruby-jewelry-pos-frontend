import type { ProductEntry } from "../../api/types";

export function ProductRow({ product, onClick }: { product: ProductEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-ruby-800 px-2 py-2 text-left hover:bg-ruby-900 active:bg-ruby-800"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-ruby-950 text-blush-100/30">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>💎</span>
        )}
      </div>
      <div className="flex-1 truncate">
        <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
        <p className="truncate text-xs text-blush-100/50">{product.sku}</p>
      </div>
      <span className="whitespace-nowrap text-sm font-semibold text-blush-200">
        S/ {product.suggested_price}
      </span>
      {product.needs_restock && <span className="text-xs text-red-400">({product.current_stock})</span>}
    </button>
  );
}
