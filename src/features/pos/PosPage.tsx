import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import { customersApi } from "../../api/contacts";
import { salesApi } from "../../api/pos";
import type { ProductEntry, SaleWritePayload } from "../../api/types";
import { ProductBrowser } from "./ProductBrowser";
import { TicketPanel } from "./TicketPanel";
import type { DraftLine } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

export function PosPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [date, setDate] = useState(today());
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"browse" | "ticket">("browse");

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.list() });
  useEffect(() => {
    if (customerId === null && customers?.length) {
      const walkIn = customers.find((c) => c.name === "Público General") ?? customers[0];
      setCustomerId(walkIn.id);
    }
  }, [customers, customerId]);

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });
  useEffect(() => {
    if (paymentMethodId === null && paymentMethods?.length) {
      const cash = paymentMethods.find((m) => m.is_cash) ?? paymentMethods[0];
      setPaymentMethodId(cash.id);
    }
  }, [paymentMethods, paymentMethodId]);

  function addProduct(product: ProductEntry) {
    setLines((current) => [
      ...current,
      {
        key: `${product.id}-${Date.now()}`,
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

  const createSaleMutation = useMutation({
    mutationFn: () => salesApi.create(buildPayload()),
    onSuccess: () => {
      setLines([]);
      setActivePanel("browse");
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  function buildPayload(): SaleWritePayload {
    return {
      date,
      customer: customerId,
      lines: lines.map((line) => ({
        product: line.product.id,
        movement_type: line.movementType,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount: line.comboKey ? undefined : line.discount,
        payment_method: line.movementType === "SALE" ? paymentMethodId : null,
        combo_key: line.comboKey ?? undefined,
        combo_discount_total: line.comboKey ? line.discount : undefined,
      })),
    };
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
            onSubmit={() => createSaleMutation.mutate()}
            isSubmitting={createSaleMutation.isPending}
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
