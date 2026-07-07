import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";

import { expenseCategoriesApi, paymentMethodsApi } from "../../api/catalogs";
import { suppliersApi } from "../../api/contacts";
import { expensesApi, fetchExchangeRatePreview } from "../../api/finance";
import type { Currency, ExpenseWritePayload, PaymentStatus, ReceiptType } from "../../api/types";

const today = () => new Date().toISOString().slice(0, 10);

const RECEIPT_TYPES: Array<{ value: ReceiptType; labelKey: string }> = [
  { value: "NONE", labelKey: "finance.receiptType.none" },
  { value: "BOLETA", labelKey: "finance.receiptType.boleta" },
  { value: "FACTURA", labelKey: "finance.receiptType.factura" },
  { value: "RECIBO", labelKey: "finance.receiptType.recibo" },
];

const PAYMENT_STATUSES: Array<{ value: PaymentStatus; labelKey: string }> = [
  { value: "CASH_ON_ORDER", labelKey: "finance.paymentStatus.cashOnOrder" },
  { value: "PREPAID", labelKey: "finance.paymentStatus.prepaid" },
  { value: "INSTALLMENTS", labelKey: "finance.paymentStatus.installments" },
  { value: "CASH_ON_DELIVERY", labelKey: "finance.paymentStatus.cashOnDelivery" },
];

const emptyForm: ExpenseWritePayload = {
  date: today(),
  category: 0,
  description: "",
  supplier: null,
  receipt_type: "NONE",
  payment_status: "CASH_ON_ORDER",
  payment_method: 0,
  payment_reference: "",
  original_amount: "",
  currency: "PEN",
};

export function ExpensesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => expenseCategoriesApi.list(),
  });
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsApi.list(),
  });
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list(),
  });
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.list(),
  });

  const [form, setForm] = useState<ExpenseWritePayload>(emptyForm);
  const [manualRate, setManualRate] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedPaymentMethod = paymentMethods?.find((m) => m.id === form.payment_method);
  const isCash = selectedPaymentMethod?.is_cash ?? true;

  const {
    data: previewRate,
    isFetching: isFetchingRate,
    isError: previewFailed,
  } = useQuery({
    queryKey: ["exchange-rate-preview", form.date, form.currency],
    queryFn: () => fetchExchangeRatePreview(form.date, form.currency as Currency),
    enabled: form.currency !== "PEN" && !!form.date,
    retry: false,
  });

  useEffect(() => {
    setRateError(previewFailed ? t("finance.rateUnavailable") : null);
  }, [previewFailed, t]);

  const effectiveRate =
    form.currency === "PEN" ? "1.0000" : previewRate ?? (manualRate || undefined);
  const amountNumber = Number(form.original_amount) || 0;
  const previewEquivalent = effectiveRate
    ? (amountNumber * Number(effectiveRate)).toFixed(2)
    : null;

  const createMutation = useMutation({
    mutationFn: () =>
      expensesApi.create({
        ...form,
        supplier: form.supplier || null,
        manual_exchange_rate: rateError && manualRate ? manualRate : undefined,
      }),
    onSuccess: () => {
      setForm({ ...emptyForm, payment_method: form.payment_method });
      setManualRate("");
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.data) {
        const data = error.response.data as Record<string, string[]>;
        setFieldErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.join(" ")])));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("finance.expenses")}</h2>

      <form
        className="mb-8 grid max-w-3xl grid-cols-2 gap-3 rounded border border-ruby-800 bg-ruby-900/50 p-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
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

        <div>
          <label className={labelClass}>{t("finance.category")}</label>
          <select
            className={fieldClass}
            value={form.category || ""}
            onChange={(event) => setForm({ ...form, category: Number(event.target.value) })}
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

        <div className="col-span-2 sm:col-span-3">
          <label className={labelClass}>{t("finance.description")}</label>
          <input
            className={fieldClass}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>{t("finance.receiptType.label")}</label>
          <select
            className={fieldClass}
            value={form.receipt_type}
            onChange={(event) =>
              setForm({ ...form, receipt_type: event.target.value as ReceiptType })
            }
          >
            {RECEIPT_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t("finance.paymentStatus.label")}</label>
          <select
            className={fieldClass}
            value={form.payment_status}
            onChange={(event) =>
              setForm({ ...form, payment_status: event.target.value as PaymentStatus })
            }
          >
            {PAYMENT_STATUSES.map((p) => (
              <option key={p.value} value={p.value}>
                {t(p.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t("finance.paymentMethod")}</label>
          <select
            className={fieldClass}
            value={form.payment_method || ""}
            onChange={(event) => setForm({ ...form, payment_method: Number(event.target.value) })}
          >
            <option value="">{t("common.select")}</option>
            {paymentMethods?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {!isCash && (
          <div>
            <label className={labelClass}>{t("finance.paymentReference")}</label>
            <input
              className={fieldClass}
              value={form.payment_reference}
              onChange={(event) => setForm({ ...form, payment_reference: event.target.value })}
            />
            {fieldErrors.payment_reference && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.payment_reference}</p>
            )}
          </div>
        )}

        <div>
          <label className={labelClass}>{t("finance.originalAmount")}</label>
          <input
            type="number"
            step="0.01"
            className={fieldClass}
            value={form.original_amount}
            onChange={(event) => setForm({ ...form, original_amount: event.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>{t("finance.currency")}</label>
          <select
            className={fieldClass}
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value as Currency })}
          >
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {form.currency !== "PEN" && (
          <div className="col-span-2 sm:col-span-3">
            {isFetchingRate && <p className="text-sm text-blush-100/60">{t("finance.fetchingRate")}</p>}
            {rateError && (
              <div>
                <p className="mb-1 text-sm text-red-400">{rateError}</p>
                <label className={labelClass}>{t("finance.manualRate")}</label>
                <input
                  className={fieldClass}
                  value={manualRate}
                  onChange={(event) => setManualRate(event.target.value)}
                />
              </div>
            )}
            {!rateError && previewRate && (
              <p className="text-sm text-blush-100/70">
                {t("finance.exchangeRate")}: {previewRate}
              </p>
            )}
          </div>
        )}

        {previewEquivalent && (
          <p className="col-span-2 text-sm font-medium text-blush-200 sm:col-span-3">
            {t("finance.penEquivalent")}: S/ {previewEquivalent}
          </p>
        )}

        <div className="col-span-2 sm:col-span-3">
          <button
            type="submit"
            className="rounded bg-ruby-600 px-4 py-1.5 text-sm font-medium text-blush-100 hover:bg-ruby-500"
          >
            {t("common.save")}
          </button>
        </div>
      </form>

      {isLoadingExpenses ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full max-w-4xl text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1">{t("finance.date")}</th>
              <th className="py-1">{t("finance.category")}</th>
              <th className="py-1">{t("finance.description")}</th>
              <th className="py-1 text-right">{t("finance.originalAmount")}</th>
              <th className="py-1 text-right">{t("finance.penEquivalent")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {expenses?.map((expense) => (
              <tr key={expense.id} className="border-b border-ruby-800">
                <td className="py-2">{expense.date}</td>
                <td className="py-2">{expense.category_name}</td>
                <td className="py-2">{expense.description}</td>
                <td className="py-2 text-right">
                  {expense.currency} {expense.original_amount}
                </td>
                <td className="py-2 text-right">S/ {expense.pen_equivalent_amount}</td>
                <td className="py-2 text-right">
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm(t("common.confirmDelete"))) deleteMutation.mutate(expense.id);
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
    </section>
  );
}
