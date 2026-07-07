import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { closeRegister } from "../../api/pos";
import type { ClosingMode, ClosingTotals, ClosingType, RegisterClosingEntry } from "../../api/types";

function isExecuted(result: ClosingTotals | RegisterClosingEntry): result is RegisterClosingEntry {
  return "id" in result;
}

// Shared by the seller's own "Cerrar caja" button in POS and the Admin
// Cierres screen's "close on behalf of" tool — the only difference is
// whether `sellerId` is passed (the narrow admin-on-behalf-of case).
export function ClosingModal({
  sellerId,
  sellerLabel,
  onClose,
  onExecuted,
}: {
  sellerId?: number;
  sellerLabel?: string;
  onClose: () => void;
  onExecuted?: () => void;
}) {
  const { t } = useTranslation();
  const [closingType, setClosingType] = useState<ClosingType>("X");
  const [mode, setMode] = useState<ClosingMode>("PANTALLA");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<ClosingTotals | RegisterClosingEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => closeRegister({ closingType, mode, pin, sellerId }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      if (isExecuted(data)) onExecuted?.();
    },
    onError: (err) => {
      const detail = isAxiosError(err) && err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : t("register.invalidPin"));
    },
  });

  function handleSubmit() {
    if (mode === "IMPRESORA" && !confirm(t("register.confirmExecute"))) return;
    mutation.mutate();
  }

  const toggleClass = (active: boolean) =>
    `flex-1 rounded border px-3 py-1.5 text-sm ${
      active ? "border-ruby-500 bg-ruby-800 text-blush-100" : "border-ruby-700 text-blush-100/60"
    }`;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded border border-ruby-700 bg-ruby-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blush-200">
            {t("register.closeCash")}
            {sellerLabel ? ` — ${sellerLabel}` : ""}
          </h2>
          <button className="text-blush-100/60 hover:text-blush-100" onClick={onClose}>
            ✕
          </button>
        </div>

        {!result && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-blush-100/60">{t("register.closingType")}</label>
              <div className="flex gap-2">
                <button className={toggleClass(closingType === "X")} onClick={() => setClosingType("X")}>
                  {t("register.closingX")}
                </button>
                <button className={toggleClass(closingType === "Z")} onClick={() => setClosingType("Z")}>
                  {t("register.closingZ")}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-blush-100/60">{t("register.mode")}</label>
              <div className="flex gap-2">
                <button className={toggleClass(mode === "PANTALLA")} onClick={() => setMode("PANTALLA")}>
                  {t("register.modePantalla")}
                </button>
                <button className={toggleClass(mode === "IMPRESORA")} onClick={() => setMode("IMPRESORA")}>
                  {t("register.modeImpresora")}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-blush-100/60">{t("register.pin")}</label>
              <input
                type="password"
                inputMode="numeric"
                className="w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder={t("register.pinPlaceholder")}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={!pin || mutation.isPending}
              onClick={handleSubmit}
              className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
            >
              {t("register.runClosing")}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-2 text-sm text-blush-100">
            {isExecuted(result) && (
              <p className="rounded bg-green-900/40 px-2 py-1 text-green-300">{t("register.closingSuccess")}</p>
            )}
            <p>
              <span className="text-blush-100/60">{t("register.periodStart")}:</span>{" "}
              {new Date(result.period_start).toLocaleString()}
            </p>
            <p>
              <span className="text-blush-100/60">{t("register.periodEnd")}:</span>{" "}
              {new Date(result.period_end).toLocaleString()}
            </p>
            <p>
              <span className="text-blush-100/60">{t("register.totalSales")}:</span> S/ {result.total_sales}
            </p>
            <div>
              <span className="text-blush-100/60">{t("register.totalByPaymentMethod")}:</span>
              <ul className="ml-4 list-disc">
                {Object.entries(result.total_by_payment_method).map(([name, amount]) => (
                  <li key={name}>
                    {name}: S/ {amount}
                  </li>
                ))}
              </ul>
            </div>
            <p>
              <span className="text-blush-100/60">{t("register.totalLosses")}:</span> S/ {result.total_losses}
            </p>
            <p>
              <span className="text-blush-100/60">{t("register.saleCount")}:</span> {result.sale_count}
            </p>

            <div className="flex gap-2 pt-2">
              {!isExecuted(result) && (
                <button
                  className="flex-1 rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
                  onClick={() => setResult(null)}
                >
                  {t("common.cancel")}
                </button>
              )}
              <button
                className="flex-1 rounded bg-ruby-600 px-3 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
                onClick={onClose}
              >
                {t("register.close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
