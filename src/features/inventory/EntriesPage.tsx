import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { inventoryEntriesApi, productsApi } from "../../api/inventory";
import type { InventoryEntryWritePayload } from "../../api/types";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: InventoryEntryWritePayload = {
  date: today(),
  product: 0,
  quantity: 1,
  unit_cost: "",
  notes: "",
};

export function EntriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });
  const { data: entries, isLoading } = useQuery({
    queryKey: ["inventory-entries"],
    queryFn: () => inventoryEntriesApi.list(),
  });

  const [form, setForm] = useState<InventoryEntryWritePayload>(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      inventoryEntriesApi.create({ ...form, unit_cost: form.unit_cost || undefined }),
    onSuccess: () => {
      setForm({ ...emptyForm, product: form.product });
      queryClient.invalidateQueries({ queryKey: ["inventory-entries"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("inventory.entries")}</h2>

      <form
        className="mb-6 grid max-w-3xl grid-cols-2 gap-3 rounded border border-ruby-800 bg-ruby-900/50 p-4 sm:grid-cols-4"
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

        <div>
          <label className={labelClass}>{t("inventory.quantity")}</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
          />
        </div>

        <div>
          <label className={labelClass}>{t("inventory.entryUnitCost")}</label>
          <input
            type="number"
            step="0.01"
            className={fieldClass}
            value={form.unit_cost ?? ""}
            onChange={(event) => setForm({ ...form, unit_cost: event.target.value })}
            placeholder={t("inventory.entryUnitCostHint")}
          />
        </div>

        <div className="col-span-3">
          <label className={labelClass}>{t("inventory.notes")}</label>
          <input
            className={fieldClass}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </div>

        <div className="col-span-2 flex items-end sm:col-span-4">
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
              <th className="py-1 text-right">{t("inventory.quantity")}</th>
              <th className="py-1 text-right">{t("inventory.entryUnitCost")}</th>
              <th className="py-1">{t("inventory.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry) => (
              <tr key={entry.id} className="border-b border-ruby-800">
                <td className="py-2">{entry.date}</td>
                <td className="py-2">{entry.product_sku}</td>
                <td className="py-2 text-right">+{entry.quantity}</td>
                <td className="py-2 text-right">{entry.unit_cost ? `S/ ${entry.unit_cost}` : "—"}</td>
                <td className="py-2">{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
