import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import { customersApi } from "../../api/contacts";
import { computeProration } from "./comboMath";
import { LineDiscountInput } from "./LineDiscountInput";
import { LineQuantityInput } from "./LineQuantityInput";
import type { DraftLine } from "./types";
import { applicableUnitPrice, packPriceDiscount } from "./types";

export function TicketPanel({
  lines,
  onUpdateLine,
  onRemoveLine,
  processDate,
  customerId,
  onCustomerChange,
  paymentMethodId,
  onPaymentMethodChange,
  onSubmit,
  isSubmitting,
  onClearTicket,
}: {
  lines: DraftLine[];
  onUpdateLine: (key: string, changes: Partial<DraftLine>) => void;
  onRemoveLine: (key: string) => void;
  processDate: string;
  customerId: number | null;
  onCustomerChange: (id: number) => void;
  paymentMethodId: number | null;
  onPaymentMethodChange: (id: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onClearTicket: () => void;
}) {
  const { t } = useTranslation();
  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.list() });
  // A deactivated method must never be selectable here, even though the
  // draft ticket might have been started while it was still active.
  const { data: allPaymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });
  const paymentMethods = allPaymentMethods?.filter((m) => m.is_active);

  // Starting a new combo is hidden for now; ungrouping an existing one still works.
  function ungroupCombo(comboKey: string) {
    lines.filter((l) => l.comboKey === comboKey).forEach((l) => onUpdateLine(l.key, { comboKey: null }));
  }

  const comboGroups = useMemo(() => {
    const groups: Record<string, DraftLine[]> = {};
    lines.forEach((line) => {
      if (line.comboKey) {
        groups[line.comboKey] = groups[line.comboKey] ?? [];
        groups[line.comboKey].push(line);
      }
    });
    return groups;
  }, [lines]);

  const total = lines.reduce((sum, line) => {
    if (line.movementType !== "SALE") return sum;
    const subtotal = Number(line.unitPrice) * line.quantity;
    let discount = Number(line.discount) || 0;
    if (line.comboKey) {
      const group = comboGroups[line.comboKey];
      const weights = group.map((l) => Number(l.unitPrice) * l.quantity);
      const idx = group.findIndex((l) => l.key === line.key);
      discount = computeProration(weights, Number(group[0].discount) || 0)[idx];
    }
    return sum + Math.max(subtotal - discount, 0);
  }, 0);

  const fieldClass = "rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-sm text-blush-100";

  function renderLine(line: DraftLine) {
    const applicableTier = line.product.price_tiers
      .filter((tier) => tier.min_quantity <= line.quantity)
      .sort((a, b) => b.min_quantity - a.min_quantity)[0];

    return (
      <div key={line.key} className="border-b border-ruby-800 py-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="truncate text-sm font-medium text-blush-100">
            {line.product.base_model} <span className="text-blush-100/50">({line.product.sku})</span>
          </p>
          <button className="text-xs text-red-400 hover:text-red-300" onClick={() => onRemoveLine(line.key)}>
            {t("common.delete")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdateLine(line.key, { movementType: line.movementType === "SALE" ? "GIFT" : "SALE" })
            }
            className={`rounded border px-2 py-1 text-xs font-medium ${
              line.movementType === "SALE"
                ? "border-ruby-700 bg-ruby-900 text-blush-100"
                : "border-ruby-500 bg-ruby-700 text-blush-100"
            }`}
          >
            {line.movementType === "SALE" ? t("pos.movementSale") : t("pos.movementGift")}
          </button>

          <LineQuantityInput
            quantity={line.quantity}
            className={`${fieldClass} w-16`}
            onChange={(quantity) => {
              const unitPrice = line.useTierPrice
                ? applicableUnitPrice(line.product, quantity)
                : line.product.suggested_price;
              const changes: Partial<DraftLine> = { quantity, unitPrice };
              if (line.usePackPrice && !line.comboKey) {
                changes.discount = packPriceDiscount(line.product, quantity);
              }
              onUpdateLine(line.key, changes);
            }}
          />

          {line.movementType === "SALE" && (
            <>
              <input
                type="number"
                step="0.01"
                className={`${fieldClass} w-20`}
                value={line.unitPrice}
                onChange={(event) => onUpdateLine(line.key, { unitPrice: event.target.value })}
              />

              {applicableTier && (
                <label className="flex items-center gap-1 text-xs text-blush-100/70">
                  <input
                    type="checkbox"
                    checked={line.useTierPrice}
                    onChange={(event) => {
                      const useTierPrice = event.target.checked;
                      onUpdateLine(line.key, {
                        useTierPrice,
                        unitPrice: useTierPrice
                          ? applicableUnitPrice(line.product, line.quantity)
                          : line.product.suggested_price,
                      });
                    }}
                  />
                  {t("pos.wholesalePrice")}
                </label>
              )}

              {line.product.pack_price && !line.comboKey && (
                <label className="flex items-center gap-1 text-xs text-blush-100/70">
                  <input
                    type="checkbox"
                    checked={line.usePackPrice}
                    onChange={(event) => {
                      const usePackPrice = event.target.checked;
                      onUpdateLine(line.key, {
                        usePackPrice,
                        discount: usePackPrice ? packPriceDiscount(line.product, line.quantity) : "0.00",
                      });
                    }}
                  />
                  {t("pos.packPrice", {
                    quantity: line.product.pack_price.pack_quantity,
                    price: line.product.pack_price.pack_price,
                  })}
                </label>
              )}

              {!line.comboKey ? (
                <LineDiscountInput
                  discount={line.discount}
                  className={`${fieldClass} w-20`}
                  placeholder={t("pos.discount")}
                  onChange={(discount) => onUpdateLine(line.key, { discount })}
                />
              ) : (
                <span className="text-xs text-blush-100/60">{t("pos.inCombo")}</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const standaloneLines = lines.filter((l) => !l.comboKey);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blush-200">{t("pos.ticket")}</h2>
        {lines.length > 0 && (
          <button className="text-xs text-blush-100/60 hover:text-red-400" onClick={onClearTicket}>
            {t("pos.clearTicket")}
          </button>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          {/* Not editable. Every sale is dated to the global process date
              at finalize time, never a client-supplied one. */}
          <label className="mb-1 block text-xs text-blush-100/60">{t("register.processDate")}</label>
          <p className={`${fieldClass} w-full`}>{processDate}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-blush-100/60">{t("contacts.customers")}</label>
          <select
            className={`${fieldClass} w-full`}
            value={customerId ?? ""}
            onChange={(event) => onCustomerChange(Number(event.target.value))}
          >
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-blush-100/60">{t("finance.paymentMethod")}</label>
          <select
            className={`${fieldClass} w-full`}
            value={paymentMethodId ?? ""}
            onChange={(event) => onPaymentMethodChange(Number(event.target.value))}
          >
            <option value="">{t("common.select")}</option>
            {paymentMethods?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 && <p className="text-sm text-blush-100/60">{t("pos.emptyTicket")}</p>}

        {standaloneLines.map(renderLine)}

        {Object.entries(comboGroups).map(([comboKey, groupLines]) => (
          <div key={comboKey} className="mb-2 rounded border border-ruby-600 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-blush-200">{t("pos.combo")}</span>
              <button className="text-xs text-blush-100/60 hover:text-blush-100" onClick={() => ungroupCombo(comboKey)}>
                {t("pos.ungroup")}
              </button>
            </div>
            {groupLines.map(renderLine)}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-ruby-800 pt-3">
        <p className="mb-2 text-right text-lg font-semibold text-blush-200">
          {t("pos.total")}: S/ {total.toFixed(2)}
        </p>
        <button
          disabled={lines.length === 0 || isSubmitting}
          onClick={onSubmit}
          className="w-full rounded bg-ruby-600 py-2.5 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
        >
          {t("pos.registerSale")}
        </button>
      </div>
    </div>
  );
}
