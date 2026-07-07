import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { ContactEntry } from "../api/types";

type ContactPayload = Omit<ContactEntry, "id">;

interface CrudApi {
  list: () => Promise<ContactEntry[]>;
  create: (payload: ContactPayload) => Promise<ContactEntry>;
  update: (id: number, payload: ContactPayload) => Promise<ContactEntry>;
  remove: (id: number) => Promise<void>;
}

const emptyForm: ContactPayload = { name: "", tax_id: "", phone: "", email: "", is_active: true };

export function ContactManager({ title, api, queryKey }: {
  title: string;
  api: CrudApi;
  queryKey: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContactPayload>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const createMutation = useMutation({
    mutationFn: () => api.create(form),
    onSuccess: () => {
      setForm(emptyForm);
      setIsCreating(false);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => api.update(id, form),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: invalidate,
  });

  function startEditing(entry: ContactEntry) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      tax_id: entry.tax_id,
      phone: entry.phone,
      email: entry.email,
      is_active: entry.is_active,
    });
  }

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-blush-100";

  function ContactFormFields() {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          className={fieldClass}
          placeholder={t("contacts.name")}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          autoFocus
        />
        <input
          className={fieldClass}
          placeholder={t("contacts.taxId")}
          value={form.tax_id}
          onChange={(event) => setForm({ ...form, tax_id: event.target.value })}
        />
        <input
          className={fieldClass}
          placeholder={t("contacts.phone")}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <input
          className={fieldClass}
          placeholder={t("contacts.email")}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </div>
    );
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blush-200">{title}</h2>
        {!isCreating && (
          <button
            className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
            onClick={() => {
              setForm(emptyForm);
              setIsCreating(true);
            }}
          >
            {t("common.add")}
          </button>
        )}
      </div>

      {isCreating && (
        <form
          className="mb-4 rounded border border-ruby-800 bg-ruby-900/50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <ContactFormFields />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="text-sm text-blush-200">
              {t("common.save")}
            </button>
            <button
              type="button"
              className="text-sm text-blush-100/60"
              onClick={() => setIsCreating(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1">{t("contacts.name")}</th>
              <th className="py-1">{t("contacts.taxId")}</th>
              <th className="py-1">{t("contacts.phone")}</th>
              <th className="py-1">{t("contacts.email")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((entry) =>
              editingId === entry.id ? (
                <tr key={entry.id} className="border-b border-ruby-800">
                  <td colSpan={5} className="py-2">
                    <ContactFormFields />
                    <div className="mt-2 flex gap-2">
                      <button
                        className="text-sm text-blush-200"
                        onClick={() => updateMutation.mutate(entry.id)}
                      >
                        {t("common.save")}
                      </button>
                      <button
                        className="text-sm text-blush-100/60"
                        onClick={() => setEditingId(null)}
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={entry.id} className="border-b border-ruby-800">
                  <td className={`py-2 ${entry.is_active ? "" : "text-blush-100/40 line-through"}`}>
                    {entry.name}
                  </td>
                  <td className="py-2">{entry.tax_id}</td>
                  <td className="py-2">{entry.phone}</td>
                  <td className="py-2">{entry.email}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      className="mr-3 text-blush-100/70 hover:text-blush-200"
                      onClick={() => startEditing(entry)}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(entry.id);
                      }}
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
