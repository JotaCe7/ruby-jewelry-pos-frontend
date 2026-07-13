import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { closeRegister } from "../../api/pos";
import type { ClosingMode, ClosingTotals, ClosingType, RegisterClosingEntry } from "../../api/types";
import { CierrePrint } from "./CierrePrint";

function isExecuted(result: ClosingTotals | RegisterClosingEntry): result is RegisterClosingEntry {
  return "id" in result;
}

// Every breakdown is grouped differently (by document series, category,
// product) but sums the exact same underlying non-voided SALE lines, so
// each one's total must reconcile with total_sales — showing it here
// makes that verifiable at a glance instead of requiring mental addition.
function sumAmounts(rows: Array<{ amount: string }>) {
  return rows.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2);
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
  const [includeProductBreakdown, setIncludeProductBreakdown] = useState(false);
  const [result, setResult] = useState<ClosingTotals | RegisterClosingEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const mutation = useMutation({
    mutationFn: () => closeRegister({ closingType, mode, pin, sellerId, includeProductBreakdown }),
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

  const authorizedByName = result ? (isExecuted(result) ? result.authorized_by_name : result.authorized_by_username) : null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded border border-ruby-700 bg-ruby-950 p-4">
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

            <label className="flex items-center gap-2 text-sm text-blush-100/80">
              <input
                type="checkbox"
                checked={includeProductBreakdown}
                onChange={(event) => setIncludeProductBreakdown(event.target.checked)}
              />
              {t("register.includeProductBreakdown")}
            </label>

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

            {closingType === "Z" && authorizedByName && (
              <p>
                <span className="text-blush-100/60">{t("closingsAdmin.authorizedBy")}:</span> {authorizedByName}
              </p>
            )}

            {result.document_breakdown.length > 0 && (
              <div>
                <span className="text-blush-100/60">{t("register.documentBreakdown")}:</span>
                <table className="mt-1 w-full text-xs">
                  <thead>
                    <tr className="text-blush-100/50">
                      <th className="pr-2 text-left font-normal">{t("register.docType")}</th>
                      <th className="pr-2 text-left font-normal">{t("register.docFirst")}</th>
                      <th className="pr-2 text-left font-normal">{t("register.docLast")}</th>
                      <th className="pr-2 text-right font-normal">{t("register.docCount")}</th>
                      <th className="text-right font-normal">{t("register.docAmount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.document_breakdown.map((row) => (
                      <tr key={`${row.document_type}-${row.series}`}>
                        <td className="pr-2">{row.document_type_display}</td>
                        <td className="pr-2 font-mono">
                          {row.series}-{String(row.first_number).padStart(6, "0")}
                        </td>
                        <td className="pr-2 font-mono">
                          {row.series}-{String(row.last_number).padStart(6, "0")}
                        </td>
                        <td className="pr-2 text-right">{row.count}</td>
                        <td className="text-right">S/ {row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  {result.document_breakdown.length > 1 && (
                    <tfoot>
                      <tr className="border-t border-ruby-800 font-semibold">
                        <td className="pr-2" colSpan={4}>
                          {t("register.total")}
                        </td>
                        <td className="text-right">S/ {sumAmounts(result.document_breakdown)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {result.category_breakdown.length > 0 && (
              <div>
                <span className="text-blush-100/60">{t("register.categoryBreakdown")}:</span>
                <ul className="ml-4 list-disc">
                  {result.category_breakdown.map((row) => (
                    <li key={row.category_id}>
                      {row.category_name}: {row.quantity} — S/ {row.amount}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 font-semibold">
                  {t("register.total")}: S/ {sumAmounts(result.category_breakdown)}
                </p>
              </div>
            )}

            {result.product_breakdown && result.product_breakdown.length > 0 && (
              <div>
                <span className="text-blush-100/60">{t("register.productBreakdown")}:</span>
                <ul className="ml-4 list-disc">
                  {result.product_breakdown.map((row) => (
                    <li key={row.product_id}>
                      {row.base_model} ({row.sku}): {row.quantity} — S/ {row.amount}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 font-semibold">
                  {t("register.total")}: S/ {sumAmounts(result.product_breakdown)}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!isExecuted(result) && (
                <button
                  className="flex-1 rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
                  onClick={() => setResult(null)}
                >
                  {t("common.cancel")}
                </button>
              )}
              {isExecuted(result) && (
                <button
                  className="flex-1 rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
                  onClick={() => setIsPrinting(true)}
                >
                  {t("ticket.print")}
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

      {isPrinting && result && isExecuted(result) && (
        <CierrePrint closing={result} onClose={() => setIsPrinting(false)} />
      )}
    </div>
  );
}
