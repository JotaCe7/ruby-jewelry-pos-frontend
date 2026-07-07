import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { customersApi, suppliersApi } from "../../api/contacts";
import { ContactManager } from "../../components/ContactManager";

export function ContactsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <nav className="mb-6 flex gap-4 border-b border-ruby-800 pb-3 text-sm">
        <NavLink
          to="/contacts"
          end
          className={({ isActive }) =>
            isActive ? "font-semibold text-blush-200" : "text-blush-100/60 hover:text-blush-100"
          }
        >
          {t("contacts.suppliers")}
        </NavLink>
        <NavLink
          to="/contacts/customers"
          className={({ isActive }) =>
            isActive ? "font-semibold text-blush-200" : "text-blush-100/60 hover:text-blush-100"
          }
        >
          {t("contacts.customers")}
        </NavLink>
      </nav>

      <Routes>
        <Route
          index
          element={
            <ContactManager title={t("contacts.suppliers")} api={suppliersApi} queryKey="suppliers" />
          }
        />
        <Route
          path="customers"
          element={
            <ContactManager title={t("contacts.customers")} api={customersApi} queryKey="customers" />
          }
        />
      </Routes>
    </div>
  );
}
