import { useTranslation } from "react-i18next";

import type { SaleEntry } from "../../api/types";

// Rendered both right after finalizing a sale in POS and when reprinting
// from the Ventas history — #print-ticket is the only thing visible when
// the browser's print dialog runs (see the @media print rule in
// index.css), so this component's own layout is what ends up on paper.
export function TicketPrint({ sale, onClose }: { sale: SaleEntry; onClose: () => void }) {
  const { t } = useTranslation();
  const document = sale.documents[0];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
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
              {document && (
                <>
                  <p>{document.document_type_display}</p>
                  <p className="font-mono">{document.document_number}</p>
                </>
              )}
            </div>

            <div className="mb-2 border-t border-b border-black py-1 text-xs">
              <p>
                {t("finance.date")}: {sale.date}
              </p>
              {sale.seller_name && (
                <p>
                  {t("ticket.seller")}: {sale.seller_name}
                </p>
              )}
              <p>
                {t("contacts.customers")}: {document?.customer_name || sale.customer_name || t("ticket.walkIn")}
              </p>
              {document?.customer_document_number && (
                <p>
                  {document.customer_document_type}: {document.customer_document_number}
                </p>
              )}
            </div>

            <table className="mb-2 w-full text-xs">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1">{t("ticket.item")}</th>
                  <th className="py-1 text-right">{t("ticket.qty")}</th>
                  <th className="py-1 text-right">{t("ticket.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {sale.line_items.map((line) => (
                  <tr key={line.id}>
                    <td className="py-0.5">
                      {line.product_name}
                      {line.movement_type !== "SALE" && (
                        <span className="ml-1 text-[10px]">
                          (
                          {line.movement_type === "GIFT" ? t("pos.movementGift") : t("pos.movementDamaged")}
                          )
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-right">{line.quantity}</td>
                    <td className="py-0.5 text-right">S/ {line.final_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black pt-1 text-xs">
              {document && (
                <>
                  <div className="flex justify-between">
                    <span>{t("ticket.subtotal")}</span>
                    <span>S/ {document.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("ticket.igv")}</span>
                    <span>S/ {document.tax_amount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold">
                <span>{t("pos.total")}</span>
                <span>S/ {sale.total}</span>
              </div>
            </div>

            {sale.is_voided && (
              <p className="mt-2 text-center font-bold uppercase">{t("ticket.voided")}</p>
            )}
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
