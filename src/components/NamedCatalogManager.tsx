import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { NamedCatalogEntry } from "../api/types";

interface CrudApi {
  list: () => Promise<NamedCatalogEntry[]>;
  create: (payload: { name: string; is_active: boolean }) => Promise<NamedCatalogEntry>;
  update: (id: number, payload: { name: string; is_active: boolean }) => Promise<NamedCatalogEntry>;
  remove: (id: number) => Promise<void>;
}

export function NamedCatalogManager({ title, api, queryKey }: {
  title: string;
  api: CrudApi;
  queryKey: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const createMutation = useMutation({
    mutationFn: () => api.create({ name: newName, is_active: true }),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (entry: NamedCatalogEntry) =>
      api.update(entry.id, { name: editingName, is_active: entry.is_active }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (entry: NamedCatalogEntry) =>
      api.update(entry.id, { name: entry.name, is_active: !entry.is_active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: invalidate,
  });

  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold text-blush-200">{title}</h2>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (newName.trim()) createMutation.mutate();
        }}
      >
        <input
          className="flex-1 rounded border border-ruby-700 bg-ruby-900 px-3 py-1.5 text-blush-100"
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
        <table className="w-full text-left">
          <tbody>
            {items?.map((entry) => (
              <tr key={entry.id} className="border-b border-ruby-800">
                <td className="py-2">
                  {editingId === entry.id ? (
                    <input
                      className="w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-blush-100"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className={entry.is_active ? "" : "text-blush-100/40 line-through"}>
                      {entry.name}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {editingId === entry.id ? (
                    <>
                      <button
                        className="mr-2 text-sm text-blush-200"
                        onClick={() => updateMutation.mutate(entry)}
                      >
                        {t("common.save")}
                      </button>
                      <button
                        className="text-sm text-blush-100/60"
                        onClick={() => setEditingId(null)}
                      >
                        {t("common.cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                        onClick={() => toggleActiveMutation.mutate(entry)}
                      >
                        {entry.is_active ? t("common.deactivate") : t("common.activate")}
                      </button>
                      <button
                        className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditingName(entry.name);
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(entry.id);
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
