import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import { customersApi } from "../../api/contacts";
import type { MovementType } from "../../api/types";
import { computeProration } from "./comboMath";
import type { DraftLine } from "./types";
import { applicableUnitPrice } from "./types";

const MOVEMENT_TYPES: Array<{ value: MovementType; labelKey: string }> = [
  { value: "SALE", labelKey: "pos.movementSale" },
  { value: "GIFT", labelKey: "pos.movementGift" },
  { value: "DAMAGED", labelKey: "pos.movementDamaged" },
];

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
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });

  const [comboSelection, setComboSelection] = useState<Set<string>>(new Set());
  const [comboDiscountInput, setComboDiscountInput] = useState("");

  function toggleComboSelection(key: string) {
    setComboSelection((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function confirmCombo() {
    const comboKey = `combo-${Date.now()}`;
    // The combo's shared discount total is stashed on every line's
    // `discount` field (all identical) so both the live preview above and
    // the payload builder in PosPage can read it off any one line.
    comboSelection.forEach((key) => onUpdateLine(key, { comboKey, discount: comboDiscountInput || "0" }));
    setComboSelection(new Set());
    setComboDiscountInput("");
  }

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
          <select
            className={fieldClass}
            value={line.movementType}
            onChange={(event) => onUpdateLine(line.key, { movementType: event.target.value as MovementType })}
          >
            {MOVEMENT_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {t(m.labelKey)}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            className={`${fieldClass} w-16`}
            value={line.quantity}
            onChange={(event) => {
              const quantity = Number(event.target.value) || 1;
              const unitPrice = line.useTierPrice
                ? applicableUnitPrice(line.product, quantity)
                : line.product.suggested_price;
              onUpdateLine(line.key, { quantity, unitPrice });
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

              {!line.comboKey ? (
                <input
                  type="number"
                  step="0.01"
                  className={`${fieldClass} w-20`}
                  placeholder={t("pos.discount")}
                  value={line.discount}
                  onChange={(event) => onUpdateLine(line.key, { discount: event.target.value })}
                />
              ) : (
                <span className="text-xs text-blush-100/60">{t("pos.inCombo")}</span>
              )}

              {!line.comboKey && (
                <label className="flex items-center gap-1 text-xs text-blush-100/70">
                  <input
                    type="checkbox"
                    checked={comboSelection.has(line.key)}
                    onChange={() => toggleComboSelection(line.key)}
                  />
                  {t("pos.addToCombo")}
                </label>
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
          {/* Not editable — every sale is dated to the global process date
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

        {comboSelection.size >= 2 && (
          <div className="mb-3 flex items-center gap-2 rounded border border-ruby-600 bg-ruby-900/60 p-2">
            <input
              type="number"
              step="0.01"
              className={fieldClass}
              placeholder={t("pos.comboDiscountTotal")}
              value={comboDiscountInput}
              onChange={(event) => setComboDiscountInput(event.target.value)}
            />
            <button className="rounded bg-ruby-600 px-3 py-1 text-sm text-blush-100" onClick={confirmCombo}>
              {t("pos.applyCombo")}
            </button>
          </div>
        )}
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
