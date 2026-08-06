import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import { customersApi } from "../../api/contacts";
import { discardDraft, fetchDraft, fetchRegisterStatus, finalizeDraft, saveDraft } from "../../api/pos";
import type {
  DraftSaleLineEntry,
  DraftSaleLineWritePayload,
  MovementType,
  ProductEntry,
  SaleEntry,
} from "../../api/types";
import { CartContext } from "./CartContext";
import { ClosingModal } from "./ClosingModal";
import { ProductBrowser } from "./ProductBrowser";
import { RegisterGate } from "./RegisterGate";
import { TicketPanel } from "./TicketPanel";
import { TicketPrint } from "./TicketPrint";
import { applicableUnitPrice, combinedDiscount, packPriceDiscount, type DraftLine } from "./types";

// The tier and pack checkboxes are mutually exclusive (stacking both would
// discount the pack's savings against the flat price while the tier's
// lower price is already active). A product with both configured defaults
// to the tier, leaving the pack promo an explicit opt-in.
function defaultLineFlags(product: ProductEntry): Pick<DraftLine, "useTierPrice" | "usePackPrice"> {
  if (product.pack_price && product.price_tiers.length > 0) {
    return { useTierPrice: true, usePackPrice: false };
  }
  return { useTierPrice: true, usePackPrice: true };
}

// The backend only ever stores the resulting unit_price/discount numbers,
// never which checkbox produced them, so reconstructing a draft's
// checkbox state means working backwards from those numbers rather than
// the product's default combination. tierPrice/flatPrice diverging at
// this quantity is what makes the tier's state readable from unit_price
// at all; the pack's exact savings inside discount work the same way.
// When neither number can tell the two states apart (e.g. the quantity
// hasn't reached either threshold yet), the product's default is the
// only reasonable answer.
function inferLineFlags(
  product: ProductEntry,
  quantity: number,
  unitPrice: string,
  discount: string,
): Pick<DraftLine, "useTierPrice" | "usePackPrice" | "extraDiscount"> {
  const tierPrice = applicableUnitPrice(product, quantity);
  const flatPrice = product.suggested_price;
  const packAuto = Number(packPriceDiscount(product, quantity));

  const tierDistinguishable = product.price_tiers.length > 0 && tierPrice !== flatPrice;
  const packDistinguishable = !!product.pack_price && packAuto > 0;

  let useTierPrice: boolean;
  let usePackPrice: boolean;
  if (tierDistinguishable) {
    useTierPrice = unitPrice === tierPrice;
    usePackPrice = !useTierPrice && packDistinguishable && Number(discount) >= packAuto;
  } else if (packDistinguishable) {
    useTierPrice = false;
    usePackPrice = Number(discount) >= packAuto;
  } else {
    ({ useTierPrice, usePackPrice } = defaultLineFlags(product));
  }

  const autoDiscount = usePackPrice ? packAuto : 0;
  const extraDiscount = Math.max(0, Number(discount) - autoDiscount).toFixed(2);
  return { useTierPrice, usePackPrice, extraDiscount };
}

function lineFromServer(line: DraftSaleLineEntry): DraftLine {
  const flags = inferLineFlags(line.product_detail, line.quantity, line.unit_price, line.discount);
  return {
    key: `line-${line.id}`,
    product: line.product_detail,
    movementType: line.movement_type,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    ...flags,
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

// The one line the product browser's own +/- controls find and adjust for
// a product: a plain SALE line outside any combo. GIFT and combo lines
// are excluded since they represent a different intent (giving some
// away, or a shared group discount) that only the ticket panel edits.
// Which tier/pack checkbox is active, and any extra discount, don't
// factor in here: the increment/decrement handlers recompute
// unitPrice/discount from whatever useTierPrice/usePackPrice/
// extraDiscount the line already carries, for any combination of them.
function isDefaultLine(line: DraftLine, productId: number): boolean {
  return line.product.id === productId && line.movementType === "SALE" && line.comboKey === null;
}

export function PosPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // A sale can only ever be created while the register is open, so the
  // whole ticket UI stays gated behind RegisterGate until it is.
  const { data: registerStatus, isLoading: isRegisterLoading } = useQuery({
    queryKey: ["register-status"],
    queryFn: fetchRegisterStatus,
  });
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [printedSale, setPrintedSale] = useState<SaleEntry | null>(null);

  // The ticket is persisted server-side (one draft per logged-in user) so
  // a dead phone or switching devices mid-sale doesn't lose it. See
  // project memory for why this replaced an earlier localStorage version.
  const { data: draft, isLoading: isDraftLoading } = useQuery({
    queryKey: ["pos-draft"],
    queryFn: fetchDraft,
    enabled: !!registerStatus?.is_open,
    // Never let a stale value outlive an unmount.
    gcTime: 0,
  });

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"browse" | "ticket">("browse");
  const [saveError, setSaveError] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const hasHydrated = useRef(false);
  useEffect(() => {
    if (!draft || hasHydrated.current) return;
    hasHydrated.current = true;
    setLines(draft.lines.map(lineFromServer));
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

  const { data: allPaymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });
  // A deactivated method must never be selectable (nor auto-selected) at
  // the register, even though the Admin's own Catalogs screen needs the
  // full list to let them reactivate one.
  const paymentMethods = allPaymentMethods?.filter((m) => m.is_active);
  useEffect(() => {
    if (hasHydrated.current && paymentMethodId === null && paymentMethods?.length) {
      const preferred = paymentMethods.find((m) => m.is_default) ?? paymentMethods[0];
      setPaymentMethodId(preferred.id);
    }
  }, [paymentMethods, paymentMethodId]);

  // Debounced autosave: skip the very first hydration render (nothing
  // changed yet) and coalesce rapid edits into one PATCH instead of one
  // per keystroke. Saves are chained through `pendingSave` (instead of
  // fired independently) so an overlapping request can never complete
  // after a newer one and silently overwrite it with older data.
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (!hasHydrated.current || !registerStatus) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const payload = {
        date: registerStatus.process_date,
        customer: customerId,
        lines: linesToPayload(lines, paymentMethodId),
      };
      // Swallow a previous attempt's rejection here (already surfaced by
      // its own .catch below) so it doesn't short-circuit this one.
      pendingSave.current = pendingSave.current.catch(() => {}).then(() => saveDraft(payload));
      pendingSave.current.then(() => setSaveError(false)).catch(() => setSaveError(true));
    }, 600);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [lines, registerStatus, customerId, paymentMethodId]);

  function addProduct(product: ProductEntry) {
    setLines((current) => {
      const existingIndex = current.findIndex((line) => isDefaultLine(line, product.id));
      if (existingIndex !== -1) {
        const existing = current[existingIndex];
        const quantity = existing.quantity + 1;
        const autoDiscount = existing.usePackPrice ? Number(packPriceDiscount(product, quantity)) : 0;
        const updated = {
          ...existing,
          quantity,
          unitPrice: existing.useTierPrice ? applicableUnitPrice(product, quantity) : product.suggested_price,
          discount: combinedDiscount(autoDiscount, existing.extraDiscount),
        };
        return current.map((line, index) => (index === existingIndex ? updated : line));
      }
      const defaults = defaultLineFlags(product);
      return [
        ...current,
        {
          key: `new-${product.id}-${current.length}`,
          product,
          movementType: "SALE",
          quantity: 1,
          unitPrice: product.suggested_price,
          ...defaults,
          extraDiscount: "0.00",
          discount: defaults.usePackPrice ? packPriceDiscount(product, 1) : "0.00",
          comboKey: null,
        },
      ];
    });
  }

  function decrementProduct(productId: number) {
    setLines((current) => {
      const existingIndex = current.findIndex((line) => isDefaultLine(line, productId));
      if (existingIndex === -1) return current;
      const existing = current[existingIndex];
      if (existing.quantity <= 1) {
        return current.filter((_, index) => index !== existingIndex);
      }
      const quantity = existing.quantity - 1;
      const autoDiscount = existing.usePackPrice ? Number(packPriceDiscount(existing.product, quantity)) : 0;
      const updated = {
        ...existing,
        quantity,
        unitPrice: existing.useTierPrice
          ? applicableUnitPrice(existing.product, quantity)
          : existing.product.suggested_price,
        discount: combinedDiscount(autoDiscount, existing.extraDiscount),
      };
      return current.map((line, index) => (index === existingIndex ? updated : line));
    });
  }

  function removeProduct(productId: number) {
    setLines((current) => current.filter((line) => !isDefaultLine(line, productId)));
  }

  function getLineQuantity(productId: number) {
    return lines.find((line) => isDefaultLine(line, productId))?.quantity ?? 0;
  }

  function updateLine(key: string, changes: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  // Sale lines for a product already merge into one via the browse
  // tile's own +/- (see isDefaultLine/addProduct above). Flipping a line
  // between Venta and Regalo needs the same treatment: a second line for
  // the same product already carrying the new movement type would
  // otherwise sit right next to the one just switched, and both would
  // print as separate rows on the receipt.
  function toggleMovementType(key: string) {
    setLines((current) => {
      const line = current.find((l) => l.key === key);
      if (!line) return current;
      const newType: MovementType = line.movementType === "SALE" ? "GIFT" : "SALE";

      const target = line.comboKey
        ? undefined
        : current.find(
            (l) =>
              l.key !== key &&
              l.product.id === line.product.id &&
              l.movementType === newType &&
              l.comboKey === null,
          );

      if (!target) {
        return current.map((l) => (l.key === key ? { ...l, movementType: newType } : l));
      }

      const quantity = target.quantity + line.quantity;
      const unitPrice = target.useTierPrice
        ? applicableUnitPrice(target.product, quantity)
        : target.product.suggested_price;
      const autoDiscount = target.usePackPrice ? Number(packPriceDiscount(target.product, quantity)) : 0;
      const discount = combinedDiscount(autoDiscount, target.extraDiscount);

      return current
        .filter((l) => l.key !== key)
        .map((l) => (l.key === target.key ? { ...l, quantity, unitPrice, discount } : l));
    });
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
      if (!registerStatus) throw new Error("register status not loaded");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      // Make sure the latest edits are saved before finalizing: the
      // debounced autosave might not have fired yet.
      await saveDraft({
        date: registerStatus.process_date,
        customer: customerId,
        lines: linesToPayload(lines, paymentMethodId),
      });
      return finalizeDraft();
    },
    onSuccess: (sale) => {
      setLines([]);
      setActivePanel("browse");
      setPrintedSale(sale);
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-draft"] });
    },
  });

  // Computed separately from the modals below so a Z closing (which flips
  // registerStatus.is_open to false and swaps this to <RegisterGate>) never
  // unmounts an already-open ClosingModal/TicketPrint mid-render: clearing
  // state the modal itself depends on would unmount it before its result
  // can be read. The modals live outside this conditional, so they only
  // ever close when the user dismisses them.
  let content: ReactNode;
  if (isRegisterLoading) {
    content = <p className="text-blush-100/70">{t("common.loading")}</p>;
  } else if (!registerStatus) {
    content = <p className="text-red-400">{t("register.statusError")}</p>;
  } else if (!registerStatus.is_open) {
    content = <RegisterGate status={registerStatus} />;
  } else if (isDraftLoading) {
    content = <p className="text-blush-100/70">{t("common.loading")}</p>;
  } else {
    content = (
      <div>
        <div className="mb-3 flex items-center justify-between text-xs text-blush-100/60">
          <span>
            {t("register.processDate")}: {registerStatus.process_date}
          </span>
          <button
            className="rounded border border-ruby-700 px-3 py-1 text-blush-100/80 hover:text-blush-100"
            onClick={() => setIsClosingModalOpen(true)}
          >
            {t("register.closeCash")}
          </button>
        </div>

        {saveError && (
          <p className="mb-3 rounded border border-red-800 bg-red-950/60 px-3 py-2 text-xs text-red-300">
            {t("pos.draftSaveError")}
          </p>
        )}

        <div className="flex flex-col gap-4 md:flex-row">
          <div
            className={`${activePanel === "browse" ? "block" : "hidden"} max-h-[75vh] flex-1 overflow-y-auto md:block`}
          >
            <CartContext.Provider
              value={{
                getLineQuantity,
                incrementProduct: addProduct,
                decrementProduct,
                removeProduct,
                expandedProductId,
                setExpandedProductId,
              }}
            >
              <ProductBrowser onSelectProduct={addProduct} />
            </CartContext.Provider>
          </div>
          <div
            // pb-20 keeps the totals/Registrar Venta footer clear of the
            // fixed "Seguir buscando" button below, which floats over
            // this same bottom-right corner on mobile.
            className={`${activePanel === "ticket" ? "block" : "hidden"} max-h-[75vh] pb-20 md:block md:w-96 md:border-l md:border-ruby-800 md:pb-0 md:pl-4`}
          >
            <TicketPanel
              lines={lines}
              onUpdateLine={updateLine}
              onRemoveLine={removeLine}
              onToggleMovementType={toggleMovementType}
              processDate={registerStatus.process_date}
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

  return (
    <div>
      {content}

      {isClosingModalOpen && (
        <ClosingModal
          onClose={() => setIsClosingModalOpen(false)}
          onExecuted={() => queryClient.invalidateQueries({ queryKey: ["register-status"] })}
        />
      )}

      {printedSale && <TicketPrint sale={printedSale} onClose={() => setPrintedSale(null)} />}
    </div>
  );
}
