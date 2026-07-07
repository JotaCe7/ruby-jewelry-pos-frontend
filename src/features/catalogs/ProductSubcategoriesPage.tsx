import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productCategoriesApi, productSubcategoriesApi } from "../../api/catalogs";
import { uploadImage } from "../../api/uploadImage";
import type { ProductSubcategoryEntry } from "../../api/types";
import { ImagePicker } from "../../components/ImagePicker";

type SubcategoryForm = { name: string; category: number | ""; is_active: boolean };

const emptyForm: SubcategoryForm = { name: "", category: "", is_active: true };

export function ProductSubcategoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
  });

  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const { data: subcategories, isLoading } = useQuery({
    queryKey: ["product-subcategories", filterCategory],
    queryFn: () =>
      productSubcategoriesApi.list(filterCategory ? { category: filterCategory } : undefined),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SubcategoryForm>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product-subcategories"] });

  const createMutation = useMutation({
    mutationFn: () =>
      productSubcategoriesApi.create({
        name: form.name,
        category: form.category as number,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      setForm(emptyForm);
      setIsCreating(false);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      productSubcategoriesApi.update(id, {
        name: form.name,
        category: form.category as number,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productSubcategoriesApi.remove(id),
    onSuccess: invalidate,
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadImage("/catalogs/product-subcategories/", id, file),
    onSuccess: invalidate,
  });

  function startEditing(entry: ProductSubcategoryEntry) {
    setEditingId(entry.id);
    setForm({ name: entry.name, category: entry.category, is_active: entry.is_active });
  }

  const fieldClass = "rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-blush-100";

  function CategorySelect({ value, onChange }: { value: number | ""; onChange: (v: number | "") => void }) {
    return (
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : "")}
      >
        <option value="">{t("catalogs.selectCategory")}</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <section className="max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blush-200">{t("catalogs.productSubcategories")}</h2>
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

      <div className="mb-4">
        <label className="mr-2 text-sm text-blush-100/70">{t("catalogs.filterByCategory")}</label>
        <CategorySelect value={filterCategory} onChange={setFilterCategory} />
      </div>

      {isCreating && (
        <form
          className="mb-4 flex items-end gap-2 rounded border border-ruby-800 bg-ruby-900/50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name.trim() && form.category) createMutation.mutate();
          }}
        >
          <div>
            <label className="mb-1 block text-xs text-blush-100/60">{t("catalogs.category")}</label>
            <CategorySelect
              value={form.category}
              onChange={(value) => setForm({ ...form, category: value })}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-blush-100/60">{t("catalogs.subcategoryName")}</label>
            <input
              className={`${fieldClass} w-full`}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              autoFocus
            />
          </div>
          <button type="submit" className="text-sm text-blush-200">
            {t("common.save")}
          </button>
          <button type="button" className="text-sm text-blush-100/60" onClick={() => setIsCreating(false)}>
            {t("common.cancel")}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full text-left">
          <tbody>
            {subcategories?.map((entry) =>
              editingId === entry.id ? (
                <tr key={entry.id} className="border-b border-ruby-800">
                  <td className="py-2" colSpan={3}>
                    <div className="flex items-end gap-2">
                      <CategorySelect
                        value={form.category}
                        onChange={(value) => setForm({ ...form, category: value })}
                      />
                      <input
                        className={`${fieldClass} flex-1`}
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        autoFocus
                      />
                      <button className="text-sm text-blush-200" onClick={() => updateMutation.mutate(entry.id)}>
                        {t("common.save")}
                      </button>
                      <button className="text-sm text-blush-100/60" onClick={() => setEditingId(null)}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={entry.id} className="border-b border-ruby-800">
                  <td className="w-14 py-2">
                    <ImagePicker
                      imageUrl={entry.image}
                      size={36}
                      onSelect={(file) => uploadImageMutation.mutate({ id: entry.id, file })}
                    />
                  </td>
                  <td className={`py-2 ${entry.is_active ? "" : "text-blush-100/40 line-through"}`}>
                    <span className="text-blush-100/50">{entry.category_name} / </span>
                    {entry.name}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                      onClick={() => startEditing(entry)}
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
