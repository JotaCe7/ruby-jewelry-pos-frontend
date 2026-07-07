import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { CatalogsPage } from "./features/catalogs/CatalogsPage";
import { ContactsPage } from "./features/contacts/ContactsPage";

function ModulePlaceholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return <h1 className="text-2xl font-semibold text-blush-100">{t(titleKey)}</h1>;
}

function AppShell() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const navItems: Array<{ to: string; labelKey: string }> = [
    { to: "/", labelKey: "nav.dashboard" },
    { to: "/catalogs", labelKey: "nav.catalogs" },
    { to: "/contacts", labelKey: "nav.contacts" },
    { to: "/finance", labelKey: "nav.finance" },
    { to: "/inventory", labelKey: "nav.inventory" },
    { to: "/pos", labelKey: "nav.pos" },
  ];

  return (
    <div className="min-h-screen bg-ruby-950 text-blush-100">
      <header className="border-b border-ruby-800 bg-ruby-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide text-blush-200">{t("app.name")}</h1>
          <button className="text-sm text-blush-100/60 hover:text-blush-100" onClick={logout}>
            {t("nav.signOut")}
          </button>
        </div>
        <nav className="mt-3 flex gap-4 text-sm">
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

      <main className="p-6">
        <Routes>
          <Route path="/" element={<ModulePlaceholder titleKey="nav.dashboard" />} />
          <Route path="/catalogs/*" element={<CatalogsPage />} />
          <Route path="/contacts/*" element={<ContactsPage />} />
          <Route path="/finance" element={<ModulePlaceholder titleKey="nav.finance" />} />
          <Route path="/inventory" element={<ModulePlaceholder titleKey="nav.inventory" />} />
          <Route path="/pos" element={<ModulePlaceholder titleKey="nav.pos" />} />
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
