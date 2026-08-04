import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { inventoryDamagesApi, productsApi } from "../../api/inventory";
import { usersApi } from "../../api/users";

const today = () => new Date().toISOString().slice(0, 10);

const OTHER = "other" as const;

interface DamageFormState {
  date: string;
  product: number;
  quantity: number;
  reason: string;
  responsibleSelection: number | typeof OTHER | "";
  responsible_other: string;
}

const emptyForm: DamageFormState = {
  date: today(),
  product: 0,
  quantity: 1,
  reason: "",
  responsibleSelection: "",
  responsible_other: "",
};

export function DamagesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list({ is_active: "true" }),
  });
  const { data: damages, isLoading } = useQuery({
    queryKey: ["inventory-damages"],
    queryFn: () => inventoryDamagesApi.list(),
  });

  const [form, setForm] = useState<DamageFormState>(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      inventoryDamagesApi.create({
        date: form.date,
        product: form.product,
        quantity: form.quantity,
        reason: form.reason,
        responsible: form.responsibleSelection === OTHER ? null : form.responsibleSelection || null,
        responsible_other: form.responsibleSelection === OTHER ? form.responsible_other : "",
      }),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["inventory-damages"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("inventory.damages")}</h2>

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

        <div>
          <label className={labelClass}>{t("inventory.damageQuantity")}</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) || 1 })}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>{t("inventory.damageResponsible")}</label>
          <select
            className={fieldClass}
            value={form.responsibleSelection}
            onChange={(event) => {
              const value = event.target.value;
              setForm({
                ...form,
                responsibleSelection: value === OTHER ? OTHER : value ? Number(value) : "",
              });
            }}
          >
            <option value="">{t("common.select")}</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
            <option value={OTHER}>{t("inventory.damageResponsibleOther")}</option>
          </select>
        </div>

        {form.responsibleSelection === OTHER && (
          <div className="col-span-2 sm:col-span-3">
            <label className={labelClass}>{t("inventory.damageResponsibleOther")}</label>
            <input
              className={fieldClass}
              value={form.responsible_other}
              onChange={(event) => setForm({ ...form, responsible_other: event.target.value })}
            />
          </div>
        )}

        <div className="col-span-2 sm:col-span-3">
          <label className={labelClass}>{t("inventory.damageReason")}</label>
          <input
            className={fieldClass}
            placeholder={t("inventory.damageReasonPlaceholder")}
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
          />
        </div>

        <div className="col-span-2 flex items-end sm:col-span-3">
          <button
            type="submit"
            className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
          >
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
              <th className="py-1 text-right">{t("inventory.damageQuantity")}</th>
              <th className="py-1">{t("inventory.damageResponsible")}</th>
              <th className="py-1">{t("inventory.damageReason")}</th>
              <th className="py-1 text-right">{t("inventory.lossValue")}</th>
            </tr>
          </thead>
          <tbody>
            {damages?.map((damage) => (
              <tr key={damage.id} className="border-b border-ruby-800">
                <td className="py-2">{damage.date}</td>
                <td className="py-2">{damage.product_sku}</td>
                <td className="py-2 text-right">{damage.quantity}</td>
                <td className="py-2">{damage.responsible_username ?? (damage.responsible_other || "—")}</td>
                <td className="py-2">{damage.reason || "—"}</td>
                <td className="py-2 text-right">
                  S/ {(Number(damage.unit_cost_snapshot) * damage.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
