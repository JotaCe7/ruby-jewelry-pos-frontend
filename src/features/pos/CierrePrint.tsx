import { useTranslation } from "react-i18next";

import type { RegisterClosingEntry } from "../../api/types";

function formatDocNumber(series: string, number: number) {
  return `${series}-${String(number).padStart(6, "0")}`;
}

// Printed the same way as TicketPrint (#print-ticket + the @media print
// rule in index.css) — shown right after an Impresora-mode X/Z closing,
// or when reprinting one from the Cierres history.
export function CierrePrint({ closing, onClose }: { closing: RegisterClosingEntry; onClose: () => void }) {
  const { t } = useTranslation();
  const isZ = closing.closing_type === "Z";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col rounded border border-ruby-700 bg-ruby-950">
        <div className="flex items-center justify-between border-b border-ruby-800 p-3">
          <h2 className="text-sm font-semibold text-blush-200">{t("ticket.title")}</h2>
          <button className="text-blush-100/60 hover:text-blush-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div id="print-ticket" className="mx-auto w-full max-w-[80mm] text-black">
            <div className="mb-2 text-center">
              <p className="font-bold">{t("app.name")}</p>
              <p>{closing.closing_type_display}</p>
            </div>

            <div className="mb-2 border-t border-b border-black py-1 text-xs">
              <p>
                {t("closingsAdmin.seller")}: {closing.seller_name}
              </p>
              <p>
                {t("register.processDate")}: {closing.process_date}
              </p>
              <p>
                {t("register.periodStart")}: {new Date(closing.period_start).toLocaleString()}
              </p>
              <p>
                {t("register.periodEnd")}: {new Date(closing.period_end).toLocaleString()}
              </p>
            </div>

            <div className="mb-2 border-b border-black pb-1 text-xs">
              <p className="mb-0.5 font-bold">{t("register.totalByPaymentMethod")}</p>
              {Object.entries(closing.total_by_payment_method).map(([name, amount]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>S/ {amount}</span>
                </div>
              ))}
            </div>

            <div className="mb-2 border-b border-black pb-1 text-xs">
              <div className="flex justify-between font-bold">
                <span>{t("register.totalSales")}</span>
                <span>S/ {closing.total_sales}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("register.saleCount")}</span>
                <span>{closing.sale_count}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("register.totalLosses")}</span>
                <span>S/ {closing.total_losses}</span>
              </div>
            </div>

            {closing.document_breakdown.length > 0 && (
              <div className="mb-2 border-b border-black pb-1 text-xs">
                <p className="mb-0.5 font-bold">{t("register.documentBreakdown")}</p>
                {closing.document_breakdown.map((row) => (
                  <div key={`${row.document_type}-${row.series}`} className="mb-1">
                    <p>{row.document_type_display}</p>
                    <div className="flex justify-between">
                      <span>{t("register.docFirst")}</span>
                      <span className="font-mono">{formatDocNumber(row.series, row.first_number)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("register.docLast")}</span>
                      <span className="font-mono">{formatDocNumber(row.series, row.last_number)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("register.docCount")}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("register.docAmount")}</span>
                      <span>S/ {row.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {closing.category_breakdown.length > 0 && (
              <div className="mb-2 border-b border-black pb-1 text-xs">
                <p className="mb-0.5 font-bold">{t("register.categoryBreakdown")}</p>
                {closing.category_breakdown.map((row) => (
                  <div key={row.category_id} className="flex justify-between">
                    <span>
                      {row.category_name} ({row.quantity})
                    </span>
                    <span>S/ {row.amount}</span>
                  </div>
                ))}
              </div>
            )}

            {closing.product_breakdown && closing.product_breakdown.length > 0 && (
              <div className="mb-2 border-b border-black pb-1 text-xs">
                <p className="mb-0.5 font-bold">{t("register.productBreakdown")}</p>
                {closing.product_breakdown.map((row) => (
                  <div key={row.product_id} className="flex justify-between">
                    <span>
                      {row.base_model} ({row.quantity})
                    </span>
                    <span>S/ {row.amount}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-xs">
              {isZ && <p className="font-bold uppercase">{t("register.registerClosed")}</p>}
              <p>
                {t("closingsAdmin.performedBy")}: {closing.performed_by_name}
              </p>
              {isZ && closing.authorized_by_name && (
                <p>
                  {t("closingsAdmin.authorizedBy")}: {closing.authorized_by_name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-ruby-800 p-3">
          <button
            className="flex-1 rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            className="flex-1 rounded bg-ruby-600 px-3 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
            onClick={() => window.print()}
          >
            {t("ticket.print")}
          </button>
        </div>
      </div>
    </div>
  );
}
