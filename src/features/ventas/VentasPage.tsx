import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { salesApi } from "../../api/pos";
import type { SaleDocumentEntry, SaleEntry } from "../../api/types";
import { TicketPrint } from "../pos/TicketPrint";
import { VoidModal } from "./VoidModal";

export function VentasPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({ queryKey: ["sales"], queryFn: () => salesApi.list() });

  const [printedSale, setPrintedSale] = useState<SaleEntry | null>(null);
  const [voidingDocument, setVoidingDocument] = useState<SaleDocumentEntry | null>(null);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("ventas.title")}</h2>

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : !sales?.length ? (
        <p className="text-blush-100/60">{t("ventas.noSales")}</p>
      ) : (
        <div className="max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-blush-100/60">
                <th className="py-1 pr-3">{t("finance.date")}</th>
                <th className="py-1 pr-3">{t("ventas.documentNumber")}</th>
                <th className="py-1 pr-3">{t("ventas.customer")}</th>
                <th className="py-1 pr-3 text-right">{t("pos.total")}</th>
                <th className="py-1 pr-3">{t("ventas.status")}</th>
                <th className="py-1 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const document = sale.documents[0];
                const canVoid =
                  document && document.status === "ISSUED" && document.document_type === "NOTA_VENTA";
                return (
                  <tr key={sale.id} className="border-b border-ruby-800">
                    <td className="py-2 pr-3">{sale.date}</td>
                    <td className="py-2 pr-3 font-mono">{document?.document_number ?? "—"}</td>
                    <td className="py-2 pr-3">{sale.customer_name ?? t("ticket.walkIn")}</td>
                    <td className="py-2 pr-3 text-right">S/ {sale.total}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          sale.is_voided ? "bg-ruby-800 text-blush-100/60" : "bg-emerald-900/50 text-emerald-300"
                        }`}
                      >
                        {sale.is_voided ? t("ventas.voided") : t("ventas.issued")}
                      </span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        className="mr-3 text-blush-100/70 hover:text-blush-200"
                        onClick={() => setPrintedSale(sale)}
                      >
                        {t("ventas.reprint")}
                      </button>
                      {canVoid && (
                        <button
                          className="text-red-400 hover:text-red-300"
                          onClick={() => setVoidingDocument(document)}
                        >
                          {t("ventas.void")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {printedSale && <TicketPrint sale={printedSale} onClose={() => setPrintedSale(null)} />}

      {voidingDocument && (
        <VoidModal
          document={voidingDocument}
          onClose={() => setVoidingDocument(null)}
          onVoided={() => queryClient.invalidateQueries({ queryKey: ["sales"] })}
        />
      )}
    </section>
  );
}
