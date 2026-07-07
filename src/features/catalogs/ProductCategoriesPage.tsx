import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { productCategoriesApi } from "../../api/catalogs";
import { uploadImage } from "../../api/uploadImage";
import { ImagePicker } from "../../components/ImagePicker";

export function ProductCategoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product-categories"] });

  const createMutation = useMutation({
    mutationFn: () => productCategoriesApi.create({ name: newName, is_active: true }),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: (id: number) => productCategoriesApi.update(id, { name: editingName }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadImage("/catalogs/product-categories/", id, file),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productCategoriesApi.remove(id),
    onSuccess: invalidate,
  });

  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold text-blush-200">{t("catalogs.productCategories")}</h2>

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
        <button type="submit" className="rounded bg-ruby-600 px-4 py-1.5 font-medium text-blush-100 hover:bg-ruby-500">
          {t("common.add")}
        </button>
      </form>

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <ul className="space-y-2">
          {categories?.map((category) => (
            <li key={category.id} className="flex items-center gap-3 border-b border-ruby-800 py-2">
              <ImagePicker
                imageUrl={category.image}
                onSelect={(file) => uploadImageMutation.mutate({ id: category.id, file })}
              />
              {editingId === category.id ? (
                <input
                  className="flex-1 rounded border border-ruby-700 bg-ruby-900 px-2 py-1 text-blush-100"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  autoFocus
                />
              ) : (
                <span className={`flex-1 ${category.is_active ? "" : "text-blush-100/40 line-through"}`}>
                  {category.name}
                </span>
              )}
              {editingId === category.id ? (
                <>
                  <button className="text-sm text-blush-200" onClick={() => updateNameMutation.mutate(category.id)}>
                    {t("common.save")}
                  </button>
                  <button className="text-sm text-blush-100/60" onClick={() => setEditingId(null)}>
                    {t("common.cancel")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="text-sm text-blush-100/70 hover:text-blush-200"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    className="text-sm text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(category.id);
                    }}
                  >
                    {t("common.delete")}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
