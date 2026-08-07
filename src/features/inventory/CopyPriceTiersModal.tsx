import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { copyPriceTiers, priceTiersApi } from "../../api/inventory";
import type { ProductEntry } from "../../api/types";

export function CopyPriceTiersModal({
  targetProductIds,
  products,
  onClose,
}: {
  targetProductIds: number[];
  products: ProductEntry[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sourceProductId, setSourceProductId] = useState<number | "">("");

  const { data: sourceTiers } = useQuery({
    queryKey: ["price-tiers", sourceProductId],
    queryFn: () => priceTiersApi.list({ product: Number(sourceProductId) }),
    enabled: !!sourceProductId,
  });

  const copyMutation = useMutation({
    mutationFn: () => copyPriceTiers(Number(sourceProductId), targetProductIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-tiers"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded border border-ruby-800 bg-ruby-950 p-4">
        <h3 className="mb-3 text-lg font-semibold text-blush-200">{t("inventory.copyPriceTiers")}</h3>

        <label className="mb-1 block text-xs text-blush-100/60">{t("inventory.copyPriceTiersSource")}</label>
        <select
          className="mb-3 w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100"
          value={sourceProductId}
          onChange={(event) => setSourceProductId(event.target.value ? Number(event.target.value) : "")}
        >
          <option value="">{t("common.select")}</option>
          {products
            .filter((product) => !targetProductIds.includes(product.id))
            .map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} ({product.base_model})
              </option>
            ))}
        </select>

        <p className="mb-3 text-sm text-blush-100/70">
          {t("inventory.copyPriceTiersTargetsCount", { count: targetProductIds.length })}
        </p>

        {sourceProductId && sourceTiers?.length === 0 && (
          <p className="mb-3 text-sm text-red-400">{t("inventory.copyPriceTiersNoTiers")}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="text-sm text-blush-100/60" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!sourceProductId || !sourceTiers?.length || copyMutation.isPending}
            className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
            onClick={() => {
              if (confirm(t("inventory.copyPriceTiersConfirm"))) copyMutation.mutate();
            }}
          >
            {t("inventory.copyPriceTiers")}
          </button>
        </div>
      </div>
    </div>
  );
}
