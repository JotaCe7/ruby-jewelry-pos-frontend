import type { ProductEntry } from "../../api/types";
import { ProductRow } from "./ProductRow";
import { ProductTile } from "./ProductTile";

export type ViewMode = "grid" | "list";

export function ProductResults({
  products,
  viewMode,
  onSelect,
}: {
  products: ProductEntry[];
  viewMode: ViewMode;
  onSelect: (product: ProductEntry) => void;
}) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductTile key={product.id} product={product} onClick={() => onSelect(product)} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded border border-ruby-800">
      {products.map((product) => (
        <ProductRow key={product.id} product={product} onClick={() => onSelect(product)} />
      ))}
    </div>
  );
}
