import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  colorVariantsApi,
  presentationsApi,
  productCategoriesApi,
  productSubcategoriesApi,
} from "../../api/catalogs";
import { suppliersApi } from "../../api/contacts";
import { previewSku, productsApi } from "../../api/inventory";
import { uploadImage } from "../../api/uploadImage";
import type { ProductEntry, ProductWritePayload } from "../../api/types";
import { ImagePicker } from "../../components/ImagePicker";

const emptyForm: ProductWritePayload & { category?: number } = {
  sku: "",
  base_model: "",
  subcategory: 0,
  category: undefined,
  color: null,
  presentation: null,
  supplier: null,
  suggested_price: "",
  min_stock: 0,
};

export function ProductsPage({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Suppliers are Admin-only on the backend and only ever used by the
  // create/edit form below, which never renders in read-only mode — skip
  // the fetch entirely for a Vendedor to avoid a pointless 403.
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
    enabled: !readOnly,
  });
  const { data: colors } = useQuery({
    queryKey: ["colors"],
    queryFn: () => colorVariantsApi.list(),
    enabled: !readOnly,
  });
  const { data: presentations } = useQuery({
    queryKey: ["presentations"],
    queryFn: () => presentationsApi.list(),
    enabled: !readOnly,
  });
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list(),
    enabled: !readOnly,
  });
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: subcategories } = useQuery({
    queryKey: ["product-subcategories", form.category],
    queryFn: () =>
      form.category ? productSubcategoriesApi.list({ category: form.category }) : Promise.resolve([]),
    enabled: !!form.category,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const { category, ...payload } = form;
      void category;
      return editingId ? productsApi.update(editingId, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      setForm(emptyForm);
      setIsCreating(false);
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: invalidate,
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadImage("/inventory/products/", id, file),
    onSuccess: invalidate,
  });

  async function handleGenerateSku() {
    if (!form.base_model) return;
    const sku = await previewSku(form.base_model, form.color, form.presentation);
    setForm({ ...form, sku });
  }

  function startEditing(product: ProductEntry) {
    setEditingId(product.id);
    setIsCreating(true);
    setForm({
      sku: product.sku,
      base_model: product.base_model,
      subcategory: product.subcategory,
      category: undefined,
      color: product.color,
      presentation: product.presentation,
      supplier: product.supplier,
      suggested_price: product.suggested_price,
      min_stock: product.min_stock,
    });
  }

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blush-200">{t("inventory.products")}</h2>
        {!readOnly && !isCreating && (
          <button
            className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setIsCreating(true);
            }}
          >
            {t("common.add")}
          </button>
        )}
      </div>

      {!readOnly && isCreating && (
        <form
          className="mb-6 grid max-w-4xl grid-cols-2 gap-3 rounded border border-ruby-800 bg-ruby-900/50 p-4 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="col-span-2">
            <label className={labelClass}>{t("inventory.baseModel")}</label>
            <input
              className={fieldClass}
              value={form.base_model}
              onChange={(event) => setForm({ ...form, base_model: event.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>{t("catalogs.category")}</label>
            <select
              className={fieldClass}
              value={form.category ?? ""}
              onChange={(event) =>
                setForm({ ...form, category: Number(event.target.value) || undefined, subcategory: 0 })
              }
            >
              <option value="">{t("common.select")}</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("catalogs.productSubcategories")}</label>
            <select
              className={fieldClass}
              value={form.subcategory || ""}
              onChange={(event) => setForm({ ...form, subcategory: Number(event.target.value) })}
              disabled={!form.category}
            >
              <option value="">{t("common.select")}</option>
              {subcategories?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("inventory.color")}</label>
            <select
              className={fieldClass}
              value={form.color ?? ""}
              onChange={(event) =>
                setForm({ ...form, color: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">{t("inventory.none")}</option>
              {colors?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("inventory.presentation")}</label>
            <select
              className={fieldClass}
              value={form.presentation ?? ""}
              onChange={(event) =>
                setForm({ ...form, presentation: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">{t("inventory.none")}</option>
              {presentations?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("finance.supplier")}</label>
            <select
              className={fieldClass}
              value={form.supplier ?? ""}
              onChange={(event) =>
                setForm({ ...form, supplier: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">{t("finance.noSupplier")}</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("inventory.suggestedPrice")}</label>
            <input
              type="number"
              step="0.01"
              className={fieldClass}
              value={form.suggested_price}
              onChange={(event) => setForm({ ...form, suggested_price: event.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>{t("inventory.minStock")}</label>
            <input
              type="number"
              className={fieldClass}
              value={form.min_stock}
              onChange={(event) => setForm({ ...form, min_stock: Number(event.target.value) })}
            />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>SKU</label>
            <div className="flex gap-2">
              <input
                className={fieldClass}
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
                placeholder={t("inventory.skuAutoHint")}
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                className="whitespace-nowrap rounded border border-ruby-700 px-3 py-1.5 text-sm text-blush-100/80 hover:text-blush-100"
              >
                {t("inventory.generateSku")}
              </button>
            </div>
          </div>

          <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
            <button type="submit" className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500">
              {t("common.save")}
            </button>
            <button
              type="button"
              className="text-sm text-blush-100/60"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full max-w-5xl text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1"></th>
              <th className="py-1">SKU</th>
              <th className="py-1">{t("inventory.baseModel")}</th>
              <th className="py-1">{t("catalogs.category")}</th>
              <th className="py-1">{t("finance.supplier")}</th>
              <th className="py-1 text-right">{t("inventory.unitCost")}</th>
              <th className="py-1 text-right">{t("inventory.suggestedPrice")}</th>
              <th className="py-1 text-right">{t("inventory.currentStock")}</th>
              {!readOnly && <th className="py-1 text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-ruby-800">
                <td className="w-14 py-2">
                  {readOnly ? (
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-ruby-900 text-blush-100/40">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">{t("common.image")}</span>
                      )}
                    </div>
                  ) : (
                    <ImagePicker
                      imageUrl={product.image}
                      size={36}
                      onSelect={(file) => uploadImageMutation.mutate({ id: product.id, file })}
                    />
                  )}
                </td>
                <td className="py-2">{product.sku}</td>
                <td className="py-2">{product.base_model}</td>
                <td className="py-2">
                  {product.category_name} / {product.subcategory_name}
                </td>
                <td className="py-2">{product.supplier_name ?? "—"}</td>
                <td className="py-2 text-right">S/ {product.unit_cost}</td>
                <td className="py-2 text-right">S/ {product.suggested_price}</td>
                <td className={`py-2 text-right ${product.needs_restock ? "font-semibold text-red-400" : ""}`}>
                  {product.current_stock}
                </td>
                {!readOnly && (
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      className="mr-3 text-blush-100/70 hover:text-blush-200"
                      onClick={() => startEditing(product)}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(product.id);
                      }}
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
