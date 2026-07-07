import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productsApi } from "../../api/inventory";
import type { ProductEntry } from "../../api/types";
import { ProductResults, type ViewMode } from "./ProductResults";

export function SkuScanInput({
  viewMode,
  onSelectProduct,
}: {
  viewMode: ViewMode;
  onSelectProduct: (product: ProductEntry) => void;
}) {
  const { t } = useTranslation();
  const [rawValue, setRawValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(rawValue), 250);
    return () => clearTimeout(timeout);
  }, [rawValue]);

  const { data: matches, isFetching } = useQuery({
    queryKey: ["pos-products", "sku", debouncedValue],
    queryFn: () => productsApi.list({ sku: debouncedValue }),
    enabled: debouncedValue.length > 0,
  });

  useEffect(() => {
    // A single exact match (typical after a real barcode scan) adds
    // straight to the ticket instead of waiting for a tap.
    if (matches?.length === 1 && matches[0].sku.toLowerCase() === debouncedValue.toLowerCase()) {
      onSelectProduct(matches[0]);
      setRawValue("");
      setDebouncedValue("");
    }
  }, [matches, debouncedValue, onSelectProduct]);

  return (
    <div>
      <input
        autoFocus
        className="mb-3 w-full rounded border border-ruby-700 bg-ruby-900 px-3 py-3 text-lg text-blush-100"
        placeholder={t("pos.scanPlaceholder")}
        value={rawValue}
        onChange={(event) => setRawValue(event.target.value)}
      />
      {isFetching && <p className="text-sm text-blush-100/60">{t("common.loading")}</p>}
      {matches && matches.length > 0 && (
        <ProductResults products={matches} viewMode={viewMode} onSelect={onSelectProduct} />
      )}
      {matches && matches.length === 0 && debouncedValue && (
        <p className="text-sm text-blush-100/60">{t("pos.noSkuMatch")}</p>
      )}
    </div>
  );
}
