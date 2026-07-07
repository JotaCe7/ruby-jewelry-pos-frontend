import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import { customersApi } from "../../api/contacts";
import { discardDraft, fetchDraft, finalizeDraft, saveDraft } from "../../api/pos";
import type {
  DraftSaleLineEntry,
  DraftSaleLineWritePayload,
  ProductEntry,
} from "../../api/types";
import { ProductBrowser } from "./ProductBrowser";
import { TicketPanel } from "./TicketPanel";
import type { DraftLine } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

function lineFromServer(line: DraftSaleLineEntry): DraftLine {
  return {
    key: `line-${line.id}`,
    product: line.product_detail,
    movementType: line.movement_type,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    useTierPrice: true,
    discount: line.discount,
    comboKey: line.combo_key || null,
  };
}

function linesToPayload(lines: DraftLine[], paymentMethodId: number | null): DraftSaleLineWritePayload[] {
  return lines.map((line) => ({
    product: line.product.id,
    movement_type: line.movementType,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    discount: line.comboKey ? "0.00" : line.discount,
    payment_method: line.movementType === "SALE" ? paymentMethodId : null,
    combo_key: line.comboKey ?? "",
    combo_discount_total: line.comboKey ? line.discount : null,
  }));
}

export function PosPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // The ticket is persisted server-side (one draft per logged-in user) so
  // a dead phone or switching devices mid-sale doesn't lose it — see
  // project memory for why this replaced an earlier localStorage version.
  const { data: draft, isLoading: isDraftLoading } = useQuery({
    queryKey: ["pos-draft"],
    queryFn: fetchDraft,
  });

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [date, setDate] = useState(today());
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"browse" | "ticket">("browse");

  const hasHydrated = useRef(false);
  useEffect(() => {
    if (!draft || hasHydrated.current) return;
    hasHydrated.current = true;
    setLines(draft.lines.map(lineFromServer));
    setDate(draft.date);
    setCustomerId(draft.customer);
    const firstSaleLine = draft.lines.find((l) => l.movement_type === "SALE" && l.payment_method);
    if (firstSaleLine) setPaymentMethodId(firstSaleLine.payment_method);
  }, [draft]);

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.list() });
  useEffect(() => {
    if (hasHydrated.current && customerId === null && customers?.length) {
      const walkIn = customers.find((c) => c.name === "Público General") ?? customers[0];
      setCustomerId(walkIn.id);
    }
  }, [customers, customerId]);

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });
  useEffect(() => {
    if (hasHydrated.current && paymentMethodId === null && paymentMethods?.length) {
      const cash = paymentMethods.find((m) => m.is_cash) ?? paymentMethods[0];
      setPaymentMethodId(cash.id);
    }
  }, [paymentMethods, paymentMethodId]);

  // Debounced autosave: skip the very first hydration render (nothing
  // changed yet) and coalesce rapid edits into one PATCH instead of one
  // per keystroke.
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasHydrated.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({
        date,
        customer: customerId,
        lines: linesToPayload(lines, paymentMethodId),
      });
    }, 600);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [lines, date, customerId, paymentMethodId]);

  function addProduct(product: ProductEntry) {
    setLines((current) => [
      ...current,
      {
        key: `new-${product.id}-${current.length}`,
        product,
        movementType: "SALE",
        quantity: 1,
        unitPrice: product.suggested_price,
        useTierPrice: true,
        discount: "0.00",
        comboKey: null,
      },
    ]);
  }

  function updateLine(key: string, changes: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  function clearTicket() {
    if (lines.length === 0) return;
    if (!confirm(t("pos.confirmClearTicket"))) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setLines([]);
    discardDraft();
  }

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      // Make sure the latest edits are saved before finalizing — the
      // debounced autosave might not have fired yet.
      await saveDraft({ date, customer: customerId, lines: linesToPayload(lines, paymentMethodId) });
      return finalizeDraft();
    },
    onSuccess: () => {
      setLines([]);
      setActivePanel("browse");
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-draft"] });
    },
  });

  if (isDraftLoading) {
    return <p className="text-blush-100/70">{t("common.loading")}</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className={`${activePanel === "browse" ? "block" : "hidden"} max-h-[75vh] flex-1 overflow-y-auto md:block`}>
          <ProductBrowser onSelectProduct={addProduct} />
        </div>
        <div
          className={`${activePanel === "ticket" ? "block" : "hidden"} max-h-[75vh] md:block md:w-96 md:border-l md:border-ruby-800 md:pl-4`}
        >
          <TicketPanel
            lines={lines}
            onUpdateLine={updateLine}
            onRemoveLine={removeLine}
            date={date}
            onDateChange={setDate}
            customerId={customerId}
            onCustomerChange={setCustomerId}
            paymentMethodId={paymentMethodId}
            onPaymentMethodChange={setPaymentMethodId}
            onSubmit={() => finalizeMutation.mutate()}
            isSubmitting={finalizeMutation.isPending}
            onClearTicket={clearTicket}
          />
        </div>
      </div>

      <button
        onClick={() => setActivePanel(activePanel === "browse" ? "ticket" : "browse")}
        className="fixed bottom-5 right-5 z-10 rounded-full bg-ruby-600 px-5 py-3 font-semibold text-blush-100 shadow-lg shadow-black/40 md:hidden"
      >
        {activePanel === "browse" ? `🛒 ${lines.length}` : t("pos.continueBrowsing")}
      </button>
    </div>
  );
}
