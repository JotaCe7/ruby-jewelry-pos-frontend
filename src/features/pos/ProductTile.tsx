import type { ProductEntry } from "../../api/types";

export function ProductTile({ product, onClick }: { product: ProductEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border border-ruby-800 bg-ruby-900 text-left hover:border-ruby-500 active:scale-[0.98]"
    >
      <div className="flex aspect-square items-center justify-center bg-ruby-950 text-blush-100/30">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">💎</span>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium text-blush-100">{product.base_model}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blush-200">S/ {product.suggested_price}</span>
          {product.needs_restock && <span className="text-xs text-red-400">{product.current_stock}</span>}
        </div>
      </div>
    </button>
  );
}
