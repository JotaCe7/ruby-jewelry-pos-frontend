import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  colorVariantsApi,
  expenseCategoriesApi,
  paymentMethodsApi,
  presentationsApi,
} from "../../api/catalogs";
import { NamedCatalogManager } from "../../components/NamedCatalogManager";
import { ProductCategoriesPage } from "./ProductCategoriesPage";
import { ProductSubcategoriesPage } from "./ProductSubcategoriesPage";

const TABS = [
  { to: "/catalogs", labelKey: "catalogs.expenseCategories" },
  { to: "/catalogs/payment-methods", labelKey: "catalogs.paymentMethods" },
  { to: "/catalogs/product-categories", labelKey: "catalogs.productCategories" },
  { to: "/catalogs/product-subcategories", labelKey: "catalogs.productSubcategories" },
  { to: "/catalogs/colors", labelKey: "catalogs.colors" },
  { to: "/catalogs/presentations", labelKey: "catalogs.presentations" },
];

export function CatalogsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-4 border-b border-ruby-800 pb-3 text-sm">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/catalogs"}
            className={({ isActive }) =>
              isActive ? "font-semibold text-blush-200" : "text-blush-100/60 hover:text-blush-100"
            }
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route
          index
          element={
            <NamedCatalogManager
              title={t("catalogs.expenseCategories")}
              api={expenseCategoriesApi}
              queryKey="expense-categories"
            />
          }
        />
        <Route
          path="payment-methods"
          element={
            <NamedCatalogManager
              title={t("catalogs.paymentMethods")}
              api={paymentMethodsApi}
              queryKey="payment-methods"
            />
          }
        />
        <Route path="product-categories" element={<ProductCategoriesPage />} />
        <Route path="product-subcategories" element={<ProductSubcategoriesPage />} />
        <Route
          path="colors"
          element={
            <NamedCatalogManager title={t("catalogs.colors")} api={colorVariantsApi} queryKey="colors" />
          }
        />
        <Route
          path="presentations"
          element={
            <NamedCatalogManager
              title={t("catalogs.presentations")}
              api={presentationsApi}
              queryKey="presentations"
            />
          }
        />
      </Routes>
    </div>
  );
}
