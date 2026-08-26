import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";

import enAuth from "./locales/en/auth.json";
import enCollections from "./locales/en/collections.json";
import enCommon from "./locales/en/common.json";
import enFigurineDetail from "./locales/en/figurineDetail.json";
import enFigurineForm from "./locales/en/figurineForm.json";
import enFigurines from "./locales/en/figurines.json";
import enNavigation from "./locales/en/navigation.json";
import enAccount from "./locales/en/account.json";
import enPreferences from "./locales/en/preferences.json";
import enAbout from "./locales/en/about.json";

import esAuth from "./locales/es/auth.json";
import esCollections from "./locales/es/collections.json";
import esCommon from "./locales/es/common.json";
import esFigurineDetail from "./locales/es/figurineDetail.json";
import esFigurineForm from "./locales/es/figurineForm.json";
import esFigurines from "./locales/es/figurines.json";
import esNavigation from "./locales/es/navigation.json";
import esAccount from "./locales/es/account.json";
import esPreferences from "./locales/es/preferences.json";
import esAbout from "./locales/es/about.json";

import { DEFAULT_LANGUAGE, normalizeLanguage, SUPPORTED_LANGUAGES } from "./languages";

export const LANGUAGE_STORAGE_KEY = "mythClothLanguage";

export const defaultNS = "common";

export const resources = {
  en: {
    auth: enAuth,
    collections: enCollections,
    common: enCommon,
    figurineDetail: enFigurineDetail,
    figurineForm: enFigurineForm,
    figurines: enFigurines,
    navigation: enNavigation,
    account: enAccount,
    preferences: enPreferences,
    about: enAbout,
  },
  es: {
    auth: esAuth,
    collections: esCollections,
    common: esCommon,
    figurineDetail: esFigurineDetail,
    figurineForm: esFigurineForm,
    figurines: esFigurines,
    navigation: esNavigation,
    account: esAccount,
    preferences: esPreferences,
    about: esAbout,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns: ["account", "auth", "collections", "common", "figurineDetail", "figurineForm", "figurines", "navigation", "preferences"],
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    // Collapses regional tags (es-MX, es-AR) onto the base bundle we ship.
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      // React already escapes interpolated values.
      escapeValue: false,
    },
  });

function applyLanguageSideEffects(language: string) {
  const normalized = normalizeLanguage(language);
  dayjs.locale(normalized);
  document.documentElement.lang = normalized;
}

i18n.on("languageChanged", applyLanguageSideEffects);
applyLanguageSideEffects(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);

export default i18n;
