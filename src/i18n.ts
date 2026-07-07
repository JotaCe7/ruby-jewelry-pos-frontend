import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import commonEs from "./locales/es/common.json";

// Spanish is the only shipped locale at launch; every string still goes
// through t() so a second locale can be added later without touching
// component code.
i18next.use(initReactI18next).init({
  lng: "es",
  fallbackLng: "es",
  resources: {
    es: { common: commonEs },
  },
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18next;
