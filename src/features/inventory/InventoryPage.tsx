import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthContext";
import { ProductsPage } from "./ProductsPage";
import { EntriesPage } from "./EntriesPage";
import { AuditsPage } from "./AuditsPage";

const TABS = [
  { to: "/inventory", labelKey: "inventory.products" },
  { to: "/inventory/entries", labelKey: "inventory.entries" },
  { to: "/inventory/audits", labelKey: "inventory.audits" },
];

export function InventoryPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.isAdmin ?? false;
  // A Vendedor only gets the read-only catalog — Entradas/Auditoría are
  // stock-correcting operations that stay Admin-only.
  const tabs = isAdmin ? TABS : TABS.slice(0, 1);

  return (
    <div>
      {isAdmin && (
        <nav className="mb-6 flex gap-4 border-b border-ruby-800 pb-3 text-sm">
          {tabs.map((tab) => (
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
      )}

      <Routes>
        <Route index element={<ProductsPage readOnly={!isAdmin} />} />
        {isAdmin && <Route path="entries" element={<EntriesPage />} />}
        {isAdmin && <Route path="audits" element={<AuditsPage />} />}
      </Routes>
    </div>
  );
}
