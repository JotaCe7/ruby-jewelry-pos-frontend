import { useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { priceTiersApi } from "../../api/inventory";
import type { PriceTierEntry } from "../../api/types";

const fieldClass = "w-24 rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-sm text-blush-100";

// This editor lives inside the outer product <form>. Enter in a plain
// input implicitly submits the nearest form (the product's "Guardar"),
// not whatever action this row's own button represents, so every input
// here blurs instead (committing its own change) rather than letting
// that bubble up.
function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function TierRow({ tier }: { tier: PriceTierEntry }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [minQuantity, setMinQuantity] = useState(String(tier.min_quantity));
  const [unitPrice, setUnitPrice] = useState(tier.unit_price);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["price-tiers", tier.product] });

  const updateMutation = useMutation({
    mutationFn: (payload: { min_quantity: number; unit_price: string }) =>
      priceTiersApi.update(tier.id, { product: tier.product, ...payload }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => priceTiersApi.remove(tier.id),
    onSuccess: invalidate,
  });

  return (
    <tr>
      <td className="py-1 pr-2">
        <input
          type="number"
          min={2}
          step={1}
          className={fieldClass}
          value={minQuantity}
          onChange={(event) => setMinQuantity(event.target.value)}
          onKeyDown={commitOnEnter}
          onBlur={() => {
            const parsed = Math.max(2, Number(minQuantity) || 2);
            setMinQuantity(String(parsed));
            if (parsed !== tier.min_quantity) {
              updateMutation.mutate({ min_quantity: parsed, unit_price: unitPrice });
            }
          }}
        />
      </td>
      <td className="py-1 pr-2">
        <input
          type="number"
          step="0.01"
          className={fieldClass}
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          onKeyDown={commitOnEnter}
          onBlur={() => {
            if (unitPrice !== tier.unit_price) {
              updateMutation.mutate({ min_quantity: Number(minQuantity) || tier.min_quantity, unit_price: unitPrice });
            }
          }}
        />
      </td>
      <td className="py-1">
        <button
          type="button"
          className="text-xs text-red-400 hover:text-red-300"
          onClick={() => deleteMutation.mutate()}
        >
          {t("common.delete")}
        </button>
      </td>
    </tr>
  );
}

export function PriceTiersEditor({
  productId,
  draftMinQuantity,
  draftUnitPrice,
  onDraftMinQuantityChange,
  onDraftUnitPriceChange,
}: {
  productId: number;
  draftMinQuantity: string;
  draftUnitPrice: string;
  onDraftMinQuantityChange: (value: string) => void;
  onDraftUnitPriceChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: tiers } = useQuery({
    queryKey: ["price-tiers", productId],
    queryFn: () => priceTiersApi.list({ product: productId }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      priceTiersApi.create({
        product: productId,
        min_quantity: Number(draftMinQuantity),
        unit_price: draftUnitPrice,
      }),
    onSuccess: () => {
      onDraftMinQuantityChange("");
      onDraftUnitPriceChange("");
      queryClient.invalidateQueries({ queryKey: ["price-tiers", productId] });
    },
  });

  const canAdd = !!draftMinQuantity && !!draftUnitPrice && !createMutation.isPending;

  function addOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (canAdd) createMutation.mutate();
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs text-blush-100/60">{t("inventory.priceTiers")}</p>
      <table className="text-sm">
        <thead>
          <tr className="text-xs text-blush-100/60">
            <th className="pr-2 text-left font-normal">{t("inventory.priceTierMinQuantity")}</th>
            <th className="pr-2 text-left font-normal">{t("inventory.priceTierUnitPrice")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tiers?.map((tier) => (
            <TierRow key={tier.id} tier={tier} />
          ))}
          <tr>
            <td className="py-1 pr-2">
              <input
                type="number"
                min={2}
                step={1}
                placeholder="6"
                className={fieldClass}
                value={draftMinQuantity}
                onChange={(event) => onDraftMinQuantityChange(event.target.value)}
                onKeyDown={addOnEnter}
              />
            </td>
            <td className="py-1 pr-2">
              <input
                type="number"
                step="0.01"
                placeholder="4.00"
                className={fieldClass}
                value={draftUnitPrice}
                onChange={(event) => onDraftUnitPriceChange(event.target.value)}
                onKeyDown={addOnEnter}
              />
            </td>
            <td className="py-1">
              <button
                type="button"
                disabled={!canAdd}
                className="text-xs text-blush-100/70 hover:text-blush-200 disabled:opacity-50"
                onClick={() => createMutation.mutate()}
              >
                {t("inventory.priceTierAddRow")}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {tiers?.length === 0 && <p className="mt-1 text-xs text-blush-100/50">{t("inventory.priceTierEmpty")}</p>}
    </div>
  );
}
