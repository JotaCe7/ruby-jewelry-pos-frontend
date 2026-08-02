import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // jsbarcode's own "EAN13" format already renders the 13 digits
    // below the bars, following the standard real-world layout — no
    // need to render the digits separately ourselves.
    JsBarcode(ref.current, value, { format: "EAN13", width: 1, height: 28, fontSize: 9, margin: 0 });
  }, [value]);

  return <svg ref={ref} />;
}

function BarcodeLabel({ product, includeName }: { product: ProductEntry; includeName: boolean }) {
  return (
    <div
      className="flex w-[35mm] flex-col items-center justify-center border border-dashed border-gray-400 p-1"
      style={{ height: "22mm", breakInside: "avoid" }}
    >
      <BarcodeSvg value={product.barcode} />
      {includeName && (
        <p className="mt-0.5 w-full truncate text-center text-[6px] leading-tight text-black">
          {product.base_model}
        </p>
      )}
    </div>
  );
}

export function BarcodeLabelModal({ product, onClose }: { product: ProductEntry; onClose: () => void }) {
  const { t } = useTranslation();
  // Kept as a string while editing (same reasoning as ProductsPage's
  // min_stock fix) so the field can be cleared to retype a value.
  const [quantity, setQuantity] = useState("1");
  const [includeName, setIncludeName] = useState(true);
  const [showPrintView, setShowPrintView] = useState(false);

  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  if (showPrintView) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded border border-ruby-700 bg-ruby-950">
          <div className="flex items-center justify-between border-b border-ruby-800 p-3">
            <h2 className="text-sm font-semibold text-blush-200">{t("inventory.printLabels")}</h2>
            <button className="text-blush-100/60 hover:text-blush-100" onClick={() => setShowPrintView(false)}>
              ✕
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            {/* Reuses the #print-ticket id/mechanism from TicketPrint —
                only one of these is ever mounted at a time, and the
                @media print rule (index.css) doesn't care what content
                lives inside it, just that everything else on the page
                gets hidden when printing. flex-wrap lets exactly as many
                35mm labels fit per row as the real page width allows,
                wrapping to new rows — and eventually new printed pages —
                on its own, with no hardcoded column count. */}
            <div id="print-ticket" className="flex flex-wrap gap-[2mm] bg-white p-[4mm]">
              {Array.from({ length: parsedQuantity }).map((_, index) => (
                <BarcodeLabel key={index} product={product} includeName={includeName} />
              ))}
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

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded border border-ruby-700 bg-ruby-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blush-200">
            {t("inventory.printLabels")} — {product.base_model}
          </h2>
          <button className="text-blush-100/60 hover:text-blush-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-blush-100/60">{t("inventory.labelQuantity")}</label>
            <input
              type="number"
              min={1}
              className="w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-blush-100/80">
            <input
              type="checkbox"
              checked={includeName}
              onChange={(event) => setIncludeName(event.target.checked)}
            />
            {t("inventory.includeNameOnLabel")}
          </label>

          <button
            className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500"
            onClick={() => setShowPrintView(true)}
          >
            {t("inventory.generateLabels")}
          </button>
        </div>
      </div>
    </div>
  );
}
