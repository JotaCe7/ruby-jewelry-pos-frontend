import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { inventoryAuditsApi, productsApi } from "../../api/inventory";
import type { InventoryAuditWritePayload } from "../../api/types";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: InventoryAuditWritePayload = {
  date: today(),
  product: 0,
  physical_count: 0,
};

export function AuditsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });
  const { data: audits, isLoading } = useQuery({
    queryKey: ["inventory-audits"],
    queryFn: () => inventoryAuditsApi.list(),
  });

  const [form, setForm] = useState<InventoryAuditWritePayload>(emptyForm);
  const selectedProduct = products?.find((p) => p.id === form.product);

  const createMutation = useMutation({
    mutationFn: () => inventoryAuditsApi.create(form),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["inventory-audits"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("inventory.audits")}</h2>

      <form
        className="mb-6 grid max-w-2xl grid-cols-2 gap-3 rounded border border-ruby-800 bg-ruby-900/50 p-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.product) createMutation.mutate();
        }}
      >
        <div>
          <label className={labelClass}>{t("finance.date")}</label>
          <input
            type="date"
            className={fieldClass}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>SKU</label>
          <select
            className={fieldClass}
            value={form.product || ""}
            onChange={(event) => setForm({ ...form, product: Number(event.target.value) })}
          >
            <option value="">{t("common.select")}</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.base_model}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <p className="col-span-2 text-sm text-blush-100/60 sm:col-span-3">
            {t("inventory.theoreticalStock")}: {selectedProduct.current_stock}
          </p>
        )}

        <div>
          <label className={labelClass}>{t("inventory.physicalCount")}</label>
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={form.physical_count}
            onChange={(event) => setForm({ ...form, physical_count: Number(event.target.value) })}
          />
        </div>

        <div className="col-span-2 flex items-end sm:col-span-3">
          <button type="submit" className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500">
            {t("common.save")}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full max-w-3xl text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1">{t("finance.date")}</th>
              <th className="py-1">SKU</th>
              <th className="py-1 text-right">{t("inventory.theoreticalStock")}</th>
              <th className="py-1 text-right">{t("inventory.physicalCount")}</th>
              <th className="py-1 text-right">{t("inventory.lossAdjustment")}</th>
              <th className="py-1 text-right">{t("inventory.lossValue")}</th>
            </tr>
          </thead>
          <tbody>
            {audits?.map((audit) => (
              <tr key={audit.id} className="border-b border-ruby-800">
                <td className="py-2">{audit.date}</td>
                <td className="py-2">{audit.product_sku}</td>
                <td className="py-2 text-right">{audit.theoretical_stock_snapshot}</td>
                <td className="py-2 text-right">{audit.physical_count}</td>
                <td
                  className={`py-2 text-right ${audit.loss_adjustment > 0 ? "text-red-400" : audit.loss_adjustment < 0 ? "text-emerald-400" : ""}`}
                >
                  {audit.loss_adjustment}
                </td>
                <td className="py-2 text-right">S/ {audit.loss_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
