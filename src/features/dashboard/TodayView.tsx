import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { fetchTodaySnapshot } from "../../api/dashboard";

export function TodayView() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-today"],
    queryFn: fetchTodaySnapshot,
    // Live view — the Admin is checking this while walking the floor, so
    // keep it fresh without requiring a manual refresh.
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <p className="text-blush-100/70">{t("common.loading")}</p>;
  }

  const cardClass = "rounded border border-ruby-800 bg-ruby-900/50 p-4";

  return (
    <div>
      <p className="mb-4 text-sm text-blush-100/60">
        {t("register.processDate")}: {data.process_date}
      </p>

      <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("dashboard.sellersToday")}</h3>
      {data.sellers.length === 0 ? (
        <p className="mb-6 text-sm text-blush-100/60">{t("dashboard.noSellers")}</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.sellers.map((seller) => (
            <div key={seller.seller_id} className={cardClass}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-blush-100">{seller.username}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    seller.is_open ? "bg-emerald-900/50 text-emerald-300" : "bg-ruby-800 text-blush-100/60"
                  }`}
                >
                  {seller.is_open ? t("dashboard.open") : t("dashboard.closed")}
                </span>
              </div>
              {seller.is_open ? (
                <div className="space-y-1 text-sm text-blush-100/80">
                  <p>
                    {t("register.totalSales")}: S/ {seller.total_sales}
                  </p>
                  <p>
                    {t("register.saleCount")}: {seller.sale_count}
                  </p>
                  <p>
                    {t("register.totalLosses")}: S/ {seller.total_losses}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blush-100/50">{t("dashboard.notOpenedYet")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold text-blush-200">{t("dashboard.lowStock")}</h3>
      {data.low_stock_products.length === 0 ? (
        <p className="text-sm text-blush-100/60">{t("dashboard.noLowStock")}</p>
      ) : (
        <table className="w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1 pr-3">SKU</th>
              <th className="py-1 pr-3">{t("inventory.baseModel")}</th>
              <th className="py-1 pr-3 text-right">{t("inventory.currentStock")}</th>
              <th className="py-1 text-right">{t("inventory.minStock")}</th>
            </tr>
          </thead>
          <tbody>
            {data.low_stock_products.map((product) => (
              <tr key={product.id} className="border-b border-ruby-800">
                <td className="py-2 pr-3">{product.sku}</td>
                <td className="py-2 pr-3">{product.base_model}</td>
                <td className="py-2 pr-3 text-right font-semibold text-red-400">{product.current_stock}</td>
                <td className="py-2 text-right">{product.min_stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
