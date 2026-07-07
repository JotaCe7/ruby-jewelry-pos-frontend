import { useState } from "react";
import { useTranslation } from "react-i18next";

import { HistoricoView } from "./HistoricoView";
import { TodayView } from "./TodayView";

const TABS = ["today", "historico"] as const;
type Tab = (typeof TABS)[number];

export function DashboardPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("today");

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-blush-200">{t("nav.dashboard")}</h2>

      <nav className="mb-6 flex gap-4 border-b border-ruby-800 pb-3 text-sm">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "font-semibold text-blush-200" : "text-blush-100/60 hover:text-blush-100"}
          >
            {t(`dashboard.tab.${key}`)}
          </button>
        ))}
      </nav>

      {tab === "today" ? <TodayView /> : <HistoricoView />}
    </section>
  );
}
