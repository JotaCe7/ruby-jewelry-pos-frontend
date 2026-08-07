import { useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { packPricesApi } from "../../api/inventory";
import type { PackPriceEntry } from "../../api/types";

const fieldClass = "w-24 rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-sm text-blush-100";

// Lives inside the outer product <form>, so Enter must commit this input
// instead of implicitly submitting the product's own "Guardar" button.
function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function ExistingPackPrice({ pack }: { pack: PackPriceEntry }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(String(pack.pack_quantity));
  const [price, setPrice] = useState(pack.pack_price);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pack-price", pack.product] });

  const updateMutation = useMutation({
    mutationFn: (payload: { pack_quantity: number; pack_price: string }) =>
      packPricesApi.update(pack.id, { product: pack.product, ...payload }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => packPricesApi.remove(pack.id),
    onSuccess: invalidate,
  });

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={2}
        step={1}
        className={fieldClass}
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        onKeyDown={commitOnEnter}
        onBlur={() => {
          const parsed = Math.max(2, Number(quantity) || 2);
          setQuantity(String(parsed));
          if (parsed !== pack.pack_quantity) {
            updateMutation.mutate({ pack_quantity: parsed, pack_price: price });
          }
        }}
      />
      <input
        type="number"
        step="0.01"
        className={fieldClass}
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        onKeyDown={commitOnEnter}
        onBlur={() => {
          if (price !== pack.pack_price) {
            updateMutation.mutate({ pack_quantity: Number(quantity) || pack.pack_quantity, pack_price: price });
          }
        }}
      />
      <button
        type="button"
        className="text-xs text-red-400 hover:text-red-300"
        onClick={() => deleteMutation.mutate()}
      >
        {t("common.delete")}
      </button>
    </div>
  );
}

export function PackPriceEditor({
  productId,
  draftQuantity,
  draftPrice,
  onDraftQuantityChange,
  onDraftPriceChange,
}: {
  productId: number;
  draftQuantity: string;
  draftPrice: string;
  onDraftQuantityChange: (value: string) => void;
  onDraftPriceChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: packPrices } = useQuery({
    queryKey: ["pack-price", productId],
    queryFn: () => packPricesApi.list({ product: productId }),
  });
  const existing = packPrices?.[0];

  const createMutation = useMutation({
    mutationFn: () =>
      packPricesApi.create({
        product: productId,
        pack_quantity: Number(draftQuantity),
        pack_price: draftPrice,
      }),
    onSuccess: () => {
      onDraftQuantityChange("");
      onDraftPriceChange("");
      queryClient.invalidateQueries({ queryKey: ["pack-price", productId] });
    },
  });

  const canCreate = !!draftQuantity && !!draftPrice && !createMutation.isPending;

  function createOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (canCreate) createMutation.mutate();
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs text-blush-100/60">{t("inventory.packPrice")}</p>
      {existing ? (
        <ExistingPackPrice pack={existing} />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={2}
            step={1}
            placeholder="2"
            className={fieldClass}
            value={draftQuantity}
            onChange={(event) => onDraftQuantityChange(event.target.value)}
            onKeyDown={createOnEnter}
          />
          <input
            type="number"
            step="0.01"
            placeholder="15.00"
            className={fieldClass}
            value={draftPrice}
            onChange={(event) => onDraftPriceChange(event.target.value)}
            onKeyDown={createOnEnter}
          />
          <button
            type="button"
            disabled={!canCreate}
            className="text-xs text-blush-100/70 hover:text-blush-200 disabled:opacity-50"
            onClick={() => createMutation.mutate()}
          >
            {t("common.add")}
          </button>
        </div>
      )}
      {!existing && <p className="mt-1 text-xs text-blush-100/50">{t("inventory.packPriceEmpty")}</p>}
    </div>
  );
}
