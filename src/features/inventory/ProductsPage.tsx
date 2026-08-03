import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  colorVariantsApi,
  presentationsApi,
  productCategoriesApi,
  productSubcategoriesApi,
} from "../../api/catalogs";
import { suppliersApi } from "../../api/contacts";
import { productsApi } from "../../api/inventory";
import { uploadImage } from "../../api/uploadImage";
import type { ProductEntry, ProductWritePayload } from "../../api/types";
import { ImagePicker } from "../../components/ImagePicker";
import { useUnsavedChanges } from "../../contexts/UnsavedChangesContext";
import { BarcodeLabelModal } from "./BarcodeLabelModal";

// min_stock is kept as a raw string while editing (like suggested_price
// already is) and only coerced to a number at submit time — a
// controlled <input type="number"> bound directly to a number state
// snaps back to "0" the instant the field is cleared to retype a value,
// since Number("") is 0, not NaN.
type ProductFormState = Omit<ProductWritePayload, "min_stock"> & {
  category?: number;
  min_stock: string;
};

const emptyForm: ProductFormState = {
  barcode: "",
  base_model: "",
  subcategory: 0,
  category: undefined,
  color: null,
  presentation: null,
  supplier: null,
  suggested_price: "",
  min_stock: "0",
};

export function ProductsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesApi.list(),
  });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: () => colorVariantsApi.list() });
  const { data: presentations } = useQuery({
    queryKey: ["presentations"],
    queryFn: () => presentationsApi.list(),
  });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: () => suppliersApi.list() });
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [printingProduct, setPrintingProduct] = useState<ProductEntry | null>(null);
  const { setDirty } = useUnsavedChanges();

  // Marks the whole app as having unsaved work for as long as this
  // panel is open — cleared on unmount too, so navigating away through
  // any path other than the guarded nav links never leaves a stale flag.
  useEffect(() => {
    setDirty(isCreating);
    return () => setDirty(false);
  }, [isCreating, setDirty]);

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
      const finalPayload = { ...payload, min_stock: Number(payload.min_stock) || 0 };
      return editingId
        ? productsApi.update(editingId, finalPayload)
        : productsApi.create(finalPayload);
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

  function startEditing(product: ProductEntry) {
    setEditingId(product.id);
    setIsCreating(true);
    setForm({
      barcode: product.barcode,
      base_model: product.base_model,
      subcategory: product.subcategory,
      category: undefined,
      color: product.color,
      presentation: product.presentation,
      supplier: product.supplier,
      suggested_price: product.suggested_price,
      min_stock: String(product.min_stock),
    });
  }

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blush-200">{t("inventory.products")}</h2>
        {!isCreating && (
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

      {isCreating && (
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
            {/* type="text" + inputMode, not type="number": several mobile
                browsers apply their own native number-field validation on
                top of React's controlled value, which can restore "0" on
                blur even when the JS state is correctly "" — this sidesteps
                that entirely while still bringing up a numeric keypad. */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={fieldClass}
              value={form.min_stock}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, min_stock: digitsOnly });
              }}
              // Selects the pre-filled "0" on focus so clicking in and
              // pressing any key (Backspace, Del, or just typing a digit)
              // replaces it immediately — no need to know the cursor
              // lands after it, where forward-Delete has nothing to do.
              onFocus={(event) => event.target.select()}
            />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>{t("inventory.code")}</label>
            {/* Never editable (backend: Product.sku has editable=False) —
                assigned automatically from the subcategory's hierarchical
                code the moment the product is saved, so there's nothing
                to type here before that happens. */}
            <p className={`${fieldClass} font-mono text-blush-100/70`}>
              {editingId
                ? (products?.find((product) => product.id === editingId)?.sku ?? "—")
                : t("inventory.codeAssignedOnSave")}
            </p>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>{t("inventory.barcode")}</label>
            <input
              className={fieldClass}
              value={form.barcode ?? ""}
              onChange={(event) => setForm({ ...form, barcode: event.target.value })}
              placeholder={t("inventory.barcodeAutoHint")}
            />
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
              <th className="py-1">{t("inventory.code")}</th>
              <th className="py-1">{t("inventory.baseModel")}</th>
              <th className="py-1">{t("catalogs.category")}</th>
              <th className="py-1">{t("finance.supplier")}</th>
              <th className="py-1 text-right">{t("inventory.unitCost")}</th>
              <th className="py-1 text-right">{t("inventory.suggestedPrice")}</th>
              <th className="py-1 text-right">{t("inventory.currentStock")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-ruby-800">
                <td className="w-14 py-2">
                  <ImagePicker
                    imageUrl={product.image}
                    size={36}
                    onSelect={(file) => uploadImageMutation.mutate({ id: product.id, file })}
                  />
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
                <td className="py-2 text-right whitespace-nowrap">
                  <button
                    className="mr-3 text-blush-100/70 hover:text-blush-200"
                    onClick={() => setPrintingProduct(product)}
                  >
                    {t("inventory.printLabels")}
                  </button>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {printingProduct && (
        <BarcodeLabelModal product={printingProduct} onClose={() => setPrintingProduct(null)} />
      )}
    </section>
  );
}
