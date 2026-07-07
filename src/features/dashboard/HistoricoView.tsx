import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, Pie } from "react-chartjs-2";

import { fetchDashboardSummary } from "../../api/dashboard";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

const PIE_COLORS = ["#e11d48", "#fb7185", "#881337", "#f2c9c9", "#be123c"];

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => `${today().slice(0, 7)}-01`;

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ruby-800 bg-ruby-900/50 p-4">
      <p className="text-xs text-blush-100/60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-blush-200">{value}</p>
    </div>
  );
}

export function HistoricoView() {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", dateFrom, dateTo],
    queryFn: () => fetchDashboardSummary({ date_from: dateFrom, date_to: dateTo }),
  });

  const fieldClass = "rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-blush-100/60">{t("dashboard.dateFrom")}</label>
          <input
            type="date"
            className={fieldClass}
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-blush-100/60">{t("dashboard.dateTo")}</label>
          <input
            type="date"
            className={fieldClass}
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </div>

      {isLoading || !data ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label={t("dashboard.totalIncome")} value={`S/ ${data.total_income}`} />
            <ScoreCard label={t("register.totalLosses")} value={`S/ ${data.total_losses}`} />
            <ScoreCard label={t("dashboard.inventoryValue")} value={`S/ ${data.inventory_value}`} />
            <ScoreCard label={t("dashboard.lowStockCount")} value={String(data.low_stock_count)} />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded border border-ruby-800 bg-ruby-900/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-blush-200">{t("dashboard.byPaymentMethod")}</h3>
              {Object.keys(data.total_by_payment_method).length === 0 ? (
                <p className="text-sm text-blush-100/60">{t("dashboard.noData")}</p>
              ) : (
                <Pie
                  data={{
                    labels: Object.keys(data.total_by_payment_method),
                    datasets: [
                      {
                        data: Object.values(data.total_by_payment_method).map(Number),
                        backgroundColor: PIE_COLORS,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { labels: { color: "#f2c9c9" } },
                      datalabels: {
                        color: "#fff",
                        formatter: (value: number) => `S/ ${value.toFixed(0)}`,
                      },
                    },
                  }}
                />
              )}
            </div>

            <div className="rounded border border-ruby-800 bg-ruby-900/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-blush-200">{t("dashboard.bySeller")}</h3>
              {data.by_seller.length === 0 ? (
                <p className="text-sm text-blush-100/60">{t("dashboard.noData")}</p>
              ) : (
                <Bar
                  data={{
                    labels: data.by_seller.map((s) => s.username),
                    datasets: [
                      {
                        label: t("register.totalSales"),
                        data: data.by_seller.map((s) => Number(s.total_sales)),
                        backgroundColor: "#e11d48",
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { display: false },
                      datalabels: { color: "#fff", anchor: "end", align: "top" },
                    },
                    scales: {
                      x: { ticks: { color: "#f2c9c9" } },
                      y: { ticks: { color: "#f2c9c9" } },
                    },
                  }}
                />
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("dashboard.bySupplier")}</h3>
            {data.by_supplier.length === 0 ? (
              <p className="text-sm text-blush-100/60">{t("dashboard.noData")}</p>
            ) : (
              <table className="w-full max-w-3xl text-left text-sm">
                <thead>
                  <tr className="text-blush-100/60">
                    <th className="py-1 pr-3">{t("finance.supplier")}</th>
                    <th className="py-1 pr-3 text-right">{t("dashboard.revenue")}</th>
                    <th className="py-1 pr-3 text-right">{t("dashboard.profit")}</th>
                    <th className="py-1 text-right">{t("dashboard.marginPct")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_supplier.map((supplier) => (
                    <tr key={supplier.supplier_id ?? "none"} className="border-b border-ruby-800">
                      <td className="py-2 pr-3">{supplier.supplier_name}</td>
                      <td className="py-2 pr-3 text-right">S/ {supplier.revenue}</td>
                      <td className="py-2 pr-3 text-right">S/ {supplier.profit}</td>
                      <td className="py-2 text-right">{supplier.margin_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("dashboard.topProducts")}</h3>
            {data.top_products.length === 0 ? (
              <p className="text-sm text-blush-100/60">{t("dashboard.noData")}</p>
            ) : (
              <table className="w-full max-w-3xl text-left text-sm">
                <thead>
                  <tr className="text-blush-100/60">
                    <th className="py-1 pr-3">SKU</th>
                    <th className="py-1 pr-3">{t("inventory.baseModel")}</th>
                    <th className="py-1 pr-3 text-right">{t("dashboard.revenue")}</th>
                    <th className="py-1 text-right">{t("inventory.quantity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.map((product) => (
                    <tr key={product.product_id} className="border-b border-ruby-800">
                      <td className="py-2 pr-3">{product.sku}</td>
                      <td className="py-2 pr-3">{product.base_model}</td>
                      <td className="py-2 pr-3 text-right">S/ {product.revenue}</td>
                      <td className="py-2 text-right">{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
