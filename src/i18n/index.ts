import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enAuth from "./locales/en/auth.json";
import enFigurines from "./locales/en/figurines.json";
import enSecurity from "./locales/en/security.json";
import enPersonal from "./locales/en/personal.json";
import enInfo from "./locales/en/info.json";

import mxCommon from "./locales/mx/common.json";
import mxNavigation from "./locales/mx/navigation.json";
import mxAuth from "./locales/mx/auth.json";
import mxFigurines from "./locales/mx/figurines.json";
import mxSecurity from "./locales/mx/security.json";
import mxPersonal from "./locales/mx/personal.json";
import mxInfo from "./locales/mx/info.json";

import esCommon from "./locales/es/common.json";
import esNavigation from "./locales/es/navigation.json";
import esAuth from "./locales/es/auth.json";
import esFigurines from "./locales/es/figurines.json";
import esSecurity from "./locales/es/security.json";
import esPersonal from "./locales/es/personal.json";
import esInfo from "./locales/es/info.json";

import frCommon from "./locales/fr/common.json";
import frNavigation from "./locales/fr/navigation.json";
import frAuth from "./locales/fr/auth.json";
import frFigurines from "./locales/fr/figurines.json";
import frSecurity from "./locales/fr/security.json";
import frPersonal from "./locales/fr/personal.json";
import frInfo from "./locales/fr/info.json";

import { DEFAULT_LANGUAGE, normalizeLanguage, SUPPORTED_LANGUAGES } from "./languages";

export const LANGUAGE_STORAGE_KEY = "mythClothLanguage";

export const defaultNS = "common";

export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    figurines: enFigurines,
    security: enSecurity,
    personal: enPersonal,
    info: enInfo,
  },
  mx: {
    common: mxCommon,
    navigation: mxNavigation,
    auth: mxAuth,
    figurines: mxFigurines,
    security: mxSecurity,
    personal: mxPersonal,
    info: mxInfo,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    auth: esAuth,
    figurines: esFigurines,
    security: esSecurity,
    personal: esPersonal,
    info: esInfo,
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    auth: frAuth,
    figurines: frFigurines,
    security: frSecurity,
    personal: frPersonal,
    info: frInfo,
  }
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns: ["common", "navigation", "auth", "figurines", "security", "personal", "info"],
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
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
