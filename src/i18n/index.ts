import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import es from "./locales/es.json";
import en from "./locales/en.json";
import pt from "./locales/pt.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: "es",
    supportedLngs: ["es", "en", "pt"],
    // Map variants like en-US → en, pt-BR → pt, es-MX → es
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "language",
      caches: ["localStorage"],
    },
  });

/**
 * Set language from user profile (highest priority when logged in).
 * Call this after fetching the profile.
 */
export const setLanguageFromProfile = (lang: string | null | undefined) => {
  if (lang && ["es", "en", "pt"].includes(lang)) {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  }
};

export default i18n;
