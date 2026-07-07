import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ProductEntry } from "../../api/types";
import { FlatProductBrowser } from "./FlatProductBrowser";
import { FolderProductBrowser } from "./FolderProductBrowser";
import type { ViewMode } from "./ProductResults";
import { SkuScanInput } from "./SkuScanInput";

type BrowseMode = "folder" | "flat" | "scan";

export function ProductBrowser({ onSelectProduct }: { onSelectProduct: (product: ProductEntry) => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<BrowseMode>("folder");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  const MODES: Array<{ key: BrowseMode; labelKey: string }> = [
    { key: "folder", labelKey: "pos.modeFolder" },
    { key: "flat", labelKey: "pos.modeFlat" },
    { key: "scan", labelKey: "pos.modeScan" },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded border border-ruby-700 p-0.5">
          {MODES.map((option) => (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              className={`rounded px-3 py-1.5 text-sm ${
                mode === option.key ? "bg-ruby-600 text-blush-100" : "text-blush-100/70"
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>

        {mode !== "scan" && (
          <div className="flex gap-1 rounded border border-ruby-700 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded px-2 py-1.5 text-sm ${viewMode === "grid" ? "bg-ruby-600 text-blush-100" : "text-blush-100/70"}`}
              title={t("pos.viewGrid")}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded px-2 py-1.5 text-sm ${viewMode === "list" ? "bg-ruby-600 text-blush-100" : "text-blush-100/70"}`}
              title={t("pos.viewList")}
            >
              ☰
            </button>
          </div>
        )}
      </div>

      {mode !== "scan" && (
        <label className="mb-3 flex items-center gap-2 text-xs text-blush-100/70">
          <input
            type="checkbox"
            checked={showOutOfStock}
            onChange={(event) => setShowOutOfStock(event.target.checked)}
          />
          {t("pos.showOutOfStock")}
        </label>
      )}

      {mode === "folder" && (
        <FolderProductBrowser
          viewMode={viewMode}
          showOutOfStock={showOutOfStock}
          onSelectProduct={onSelectProduct}
        />
      )}
      {mode === "flat" && (
        <FlatProductBrowser
          viewMode={viewMode}
          showOutOfStock={showOutOfStock}
          onSelectProduct={onSelectProduct}
        />
      )}
      {mode === "scan" && <SkuScanInput viewMode={viewMode} onSelectProduct={onSelectProduct} />}
    </div>
  );
}
