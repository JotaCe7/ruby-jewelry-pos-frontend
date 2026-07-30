import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { paymentMethodsApi } from "../../api/catalogs";
import type { PaymentMethodEntry } from "../../api/types";

export function PaymentMethodsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] });

  const createMutation = useMutation({
    mutationFn: () => paymentMethodsApi.create({ name: newName, is_active: true }),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: (id: number) => paymentMethodsApi.update(id, { name: editingName }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (method: PaymentMethodEntry) =>
      paymentMethodsApi.update(method.id, { is_active: !method.is_active }),
    onSuccess: invalidate,
  });

  const toggleCashMutation = useMutation({
    mutationFn: (method: PaymentMethodEntry) =>
      paymentMethodsApi.update(method.id, { is_cash: !method.is_cash }),
    onSuccess: invalidate,
  });

  // Exclusive on the backend — setting one clears every other one, so
  // there's nothing to do here besides send the request for this row.
  const setDefaultMutation = useMutation({
    mutationFn: (method: PaymentMethodEntry) => paymentMethodsApi.update(method.id, { is_default: true }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentMethodsApi.remove(id),
    onSuccess: invalidate,
  });

  const fieldClass = "rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-blush-100";

  return (
    <section className="max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold text-blush-200">{t("catalogs.paymentMethods")}</h2>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (newName.trim()) createMutation.mutate();
        }}
      >
        <input
          className={`${fieldClass} flex-1`}
          placeholder={t("catalogs.newEntryPlaceholder")}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-ruby-600 px-4 py-1.5 font-medium text-blush-100 hover:bg-ruby-500"
        >
          {t("common.add")}
        </button>
      </form>

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1 pr-3">{t("finance.paymentMethod")}</th>
              <th className="py-1 pr-3">{t("catalogs.isCash")}</th>
              <th className="py-1 pr-3">{t("catalogs.isDefault")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {methods?.map((method) => (
              <tr key={method.id} className="border-b border-ruby-800">
                <td className="py-2 pr-3">
                  {editingId === method.id ? (
                    <input
                      className={fieldClass}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className={method.is_active ? "" : "text-blush-100/40 line-through"}>
                      {method.name}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={method.is_cash}
                    onChange={() => toggleCashMutation.mutate(method)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="radio"
                    name="default-payment-method"
                    checked={method.is_default}
                    onChange={() => setDefaultMutation.mutate(method)}
                  />
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {editingId === method.id ? (
                    <>
                      <button
                        className="mr-2 text-sm text-blush-200"
                        onClick={() => updateNameMutation.mutate(method.id)}
                      >
                        {t("common.save")}
                      </button>
                      <button className="text-sm text-blush-100/60" onClick={() => setEditingId(null)}>
                        {t("common.cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                        onClick={() => toggleActiveMutation.mutate(method)}
                      >
                        {method.is_active ? t("common.deactivate") : t("common.activate")}
                      </button>
                      <button
                        className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                        onClick={() => {
                          setEditingId(method.id);
                          setEditingName(method.name);
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(method.id);
                        }}
                      >
                        {t("common.delete")}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
