import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { fetchUsers } from "../../api/auth";
import {
  fetchPinStatus,
  forceOpenRegister,
  registerClosingsApi,
  setClosingPin,
  setProcessDate,
} from "../../api/pos";
import type { RegisterClosingEntry, SetProcessDateResult } from "../../api/types";
import { CierrePrint } from "../pos/CierrePrint";
import { ClosingModal } from "../pos/ClosingModal";

const today = () => new Date().toISOString().slice(0, 10);

function extractErrorDetail(error: unknown) {
  const detail = isAxiosError(error) && error.response?.data?.detail;
  return typeof detail === "string" ? detail : null;
}

export function RegisterAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const { data: pinStatus } = useQuery({ queryKey: ["closing-pin-status"], queryFn: fetchPinStatus });
  const [historySeller, setHistorySeller] = useState<number | "">("");
  const { data: closings, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["register-closings", historySeller],
    queryFn: () => registerClosingsApi.list(historySeller ? { seller: historySeller } : undefined),
  });

  const [newPin, setNewPin] = useState("");
  const pinMutation = useMutation({
    mutationFn: () => setClosingPin(newPin),
    onSuccess: () => {
      setNewPin("");
      queryClient.invalidateQueries({ queryKey: ["closing-pin-status"] });
    },
  });

  // Both steps of the retroactive-correction flow share one seller
  // selection — closing on someone else's behalf only ever makes sense as
  // the tail end of "I just force-opened their register to attribute a
  // forgotten sale," never as a standalone tool, so re-picking the seller
  // clears the "force-opened" flag and hides the close button again.
  const [forceOpenSellerId, setForceOpenSellerId] = useState<number | "">("");
  const [forceOpenedSellerId, setForceOpenedSellerId] = useState<number | null>(null);
  const forceOpenMutation = useMutation({
    mutationFn: () => forceOpenRegister(Number(forceOpenSellerId)),
    onSuccess: () => setForceOpenedSellerId(Number(forceOpenSellerId)),
  });
  const forceOpenErrorDetail = extractErrorDetail(forceOpenMutation.error);

  function handleForceOpenSellerChange(value: number | "") {
    setForceOpenSellerId(value);
    setForceOpenedSellerId(null);
  }

  const [newProcessDate, setNewProcessDate] = useState(today());
  const [dateWarnings, setDateWarnings] = useState<SetProcessDateResult | null>(null);
  const setDateMutation = useMutation({
    mutationFn: () => setProcessDate(newProcessDate),
    onSuccess: (data) => setDateWarnings(data),
  });

  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [printingClosing, setPrintingClosing] = useState<RegisterClosingEntry | null>(null);
  const canCloseOnBehalf = forceOpenedSellerId !== null && forceOpenedSellerId === forceOpenSellerId;
  const closingSeller = canCloseOnBehalf ? users?.find((u) => u.id === forceOpenSellerId) : undefined;

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";
  const sectionClass = "mb-6 max-w-xl rounded border border-ruby-800 bg-ruby-900/50 p-4";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("closingsAdmin.title")}</h2>

      <div className={sectionClass}>
        <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("closingsAdmin.pinSection")}</h3>
        <p className="mb-2 text-sm text-blush-100/70">{t("closingsAdmin.pinHint")}</p>
        <p className="mb-3 text-sm text-blush-100/70">
          {pinStatus?.has_pin ? t("closingsAdmin.pinSet") : t("closingsAdmin.pinNotSet")}
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            className={fieldClass}
            placeholder={t("closingsAdmin.newPin")}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value)}
          />
          <button
            disabled={!newPin || pinMutation.isPending}
            onClick={() => pinMutation.mutate()}
            className="whitespace-nowrap rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
          >
            {t("closingsAdmin.setPin")}
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("closingsAdmin.forceOpenSection")}</h3>
        <p className="mb-3 text-sm text-blush-100/70">{t("closingsAdmin.forceOpenHint")}</p>
        <div className="flex gap-2">
          <select
            className={fieldClass}
            value={forceOpenSellerId}
            onChange={(event) =>
              handleForceOpenSellerChange(event.target.value ? Number(event.target.value) : "")
            }
          >
            <option value="">{t("closingsAdmin.seller")}</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
          <button
            disabled={!forceOpenSellerId || forceOpenMutation.isPending}
            onClick={() => forceOpenMutation.mutate()}
            className="whitespace-nowrap rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
          >
            {t("closingsAdmin.forceOpenButton")}
          </button>
        </div>
        {forceOpenErrorDetail && <p className="mt-2 text-sm text-red-400">{forceOpenErrorDetail}</p>}

        {canCloseOnBehalf && (
          <div className="mt-3 border-t border-ruby-800 pt-3">
            <p className="mb-2 text-sm text-emerald-400">{t("closingsAdmin.forceOpenSuccess")}</p>
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="whitespace-nowrap rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
            >
              {t("closingsAdmin.closeThisSeller")}
            </button>
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("closingsAdmin.setDateSection")}</h3>
        <div className="flex gap-2">
          <input
            type="date"
            className={fieldClass}
            value={newProcessDate}
            onChange={(event) => setNewProcessDate(event.target.value)}
          />
          <button
            disabled={setDateMutation.isPending}
            onClick={() => setDateMutation.mutate()}
            className="whitespace-nowrap rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
          >
            {t("closingsAdmin.setDateButton")}
          </button>
        </div>
        {dateWarnings?.is_future && (
          <p className="mt-2 text-sm text-amber-400">{t("closingsAdmin.warningFuture")}</p>
        )}
        {dateWarnings?.has_prior_z && (
          <p className="mt-2 text-sm text-amber-400">{t("closingsAdmin.warningPriorZ")}</p>
        )}
      </div>

      <div className="mb-3 max-w-4xl">
        <label className={labelClass}>{t("closingsAdmin.filterSeller")}</label>
        <select
          className={`${fieldClass} max-w-xs`}
          value={historySeller}
          onChange={(event) => setHistorySeller(event.target.value ? Number(event.target.value) : "")}
        >
          <option value="">{t("common.select")}</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("closingsAdmin.historySection")}</h3>
      {isHistoryLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : !closings?.length ? (
        <p className="text-blush-100/60">{t("closingsAdmin.noClosings")}</p>
      ) : (
        <table className="w-full max-w-4xl text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1 pr-3">{t("finance.date")}</th>
              <th className="py-1 pr-3">{t("closingsAdmin.seller")}</th>
              <th className="py-1 pr-3">{t("register.closingType")}</th>
              <th className="py-1 pr-3 text-right">{t("register.totalSales")}</th>
              <th className="py-1 pr-3 text-right">{t("register.totalLosses")}</th>
              <th className="py-1 pr-3 text-right">{t("register.saleCount")}</th>
              <th className="py-1 pr-3">{t("closingsAdmin.performedBy")}</th>
              <th className="py-1 pr-3">{t("closingsAdmin.authorizedBy")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {closings.map((closing) => (
              <tr key={closing.id} className="border-b border-ruby-800">
                <td className="py-2 pr-3">{closing.process_date}</td>
                <td className="py-2 pr-3">{closing.seller_name}</td>
                <td className="py-2 pr-3">{closing.closing_type_display}</td>
                <td className="py-2 pr-3 text-right">S/ {closing.total_sales}</td>
                <td className="py-2 pr-3 text-right">S/ {closing.total_losses}</td>
                <td className="py-2 pr-3 text-right">{closing.sale_count}</td>
                <td className="py-2 pr-3">{closing.performed_by_name}</td>
                <td className="py-2 pr-3">{closing.authorized_by_name ?? "—"}</td>
                <td className="py-2 text-right">
                  <button
                    className="text-blush-100/70 hover:text-blush-200"
                    onClick={() => setPrintingClosing(closing)}
                  >
                    {t("ventas.reprint")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isClosingModalOpen && closingSeller && (
        <ClosingModal
          sellerId={closingSeller.id}
          sellerLabel={closingSeller.username}
          onClose={() => {
            setIsClosingModalOpen(false);
            // Only hide the "close this seller" affordance once the admin
            // has actually dismissed the modal — clearing it eagerly on
            // execute would unmount the modal before they can read the
            // just-persisted totals (closingSeller derives from this flag).
            setForceOpenedSellerId(null);
          }}
          onExecuted={() => queryClient.invalidateQueries({ queryKey: ["register-closings"] })}
        />
      )}

      {printingClosing && (
        <CierrePrint closing={printingClosing} onClose={() => setPrintingClosing(null)} />
      )}
    </section>
  );
}
