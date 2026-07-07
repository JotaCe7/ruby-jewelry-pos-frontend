import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProductsPage } from "./ProductsPage";
import { EntriesPage } from "./EntriesPage";
import { AuditsPage } from "./AuditsPage";

const TABS = [
  { to: "/inventory", labelKey: "inventory.products" },
  { to: "/inventory/entries", labelKey: "inventory.entries" },
  { to: "/inventory/audits", labelKey: "inventory.audits" },
];

// Admin-only screen — see App.tsx: the route itself isn't registered for
// a Vendedor, since the catalog table shows unit_cost/supplier per
// product (the POS picker covers their legitimate stock-visibility need
// without that leak).
export function InventoryPage() {
  const { t } = useTranslation();

  return (
    <div>
      <nav className="mb-6 flex gap-4 border-b border-ruby-800 pb-3 text-sm">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/inventory"}
            className={({ isActive }) =>
              isActive ? "font-semibold text-blush-200" : "text-blush-100/60 hover:text-blush-100"
            }
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<ProductsPage />} />
        <Route path="entries" element={<EntriesPage />} />
        <Route path="audits" element={<AuditsPage />} />
      </Routes>
    </div>
  );
}
