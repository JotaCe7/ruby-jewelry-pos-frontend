import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { CatalogsPage } from "./features/catalogs/CatalogsPage";
import { ContactsPage } from "./features/contacts/ContactsPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ExpensesPage } from "./features/finance/ExpensesPage";
import { InventoryPage } from "./features/inventory/InventoryPage";
import { PosPage } from "./features/pos/PosPage";
import { RegisterAdminPage } from "./features/register/RegisterAdminPage";
import { VentasPage } from "./features/ventas/VentasPage";

const ADMIN_NAV_ITEMS: Array<{ to: string; labelKey: string }> = [
  { to: "/", labelKey: "nav.dashboard" },
  { to: "/catalogs", labelKey: "nav.catalogs" },
  { to: "/contacts", labelKey: "nav.contacts" },
  { to: "/finance", labelKey: "nav.finance" },
  { to: "/inventory", labelKey: "nav.inventory" },
  { to: "/pos", labelKey: "nav.pos" },
  { to: "/ventas", labelKey: "nav.ventas" },
  { to: "/register", labelKey: "nav.closings" },
];

// A Vendedor mostly just needs POS. Inventario is deliberately left out —
// its catalog table shows unit_cost and supplier per product, which is
// exactly the margin/business-relationship data kept out of Finanzas/
// Proveedores for this role; the POS picker already covers the legitimate
// need (stock while selling) without that leak. Ventas IS included — a
// seller needs to reprint or void their own recent tickets, and the
// backend scopes that screen to their own sales only.
const SELLER_NAV_ITEMS: Array<{ to: string; labelKey: string }> = [
  { to: "/pos", labelKey: "nav.pos" },
  { to: "/ventas", labelKey: "nav.ventas" },
];

function AppShell() {
  const { t } = useTranslation();
  const { logout, currentUser } = useAuth();

  if (!currentUser) {
    return <div className="min-h-screen bg-ruby-950" />;
  }

  const isAdmin = currentUser.isAdmin;
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : SELLER_NAV_ITEMS;

  return (
    <div className="min-h-screen bg-ruby-950 text-blush-100">
      <header className="border-b border-ruby-800 bg-ruby-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide text-blush-200">{t("app.name")}</h1>
          <button className="text-sm text-blush-100/60 hover:text-blush-100" onClick={logout}>
            {t("nav.signOut")}
          </button>
        </div>
        <nav className={`flex gap-4 text-sm ${isAdmin ? "mt-3" : "mt-2"}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "text-blush-200 font-semibold" : "text-blush-100/70"
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={isAdmin ? "p-6" : "p-3"}>
        <Routes>
          <Route path="/" element={isAdmin ? <DashboardPage /> : <Navigate to="/pos" replace />} />
          {isAdmin && <Route path="/catalogs/*" element={<CatalogsPage />} />}
          {isAdmin && <Route path="/contacts/*" element={<ContactsPage />} />}
          {isAdmin && <Route path="/finance" element={<ExpensesPage />} />}
          {isAdmin && <Route path="/inventory/*" element={<InventoryPage />} />}
          {isAdmin && <Route path="/register" element={<RegisterAdminPage />} />}
          <Route path="/pos" element={<PosPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          {!isAdmin && <Route path="*" element={<Navigate to="/pos" replace />} />}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
