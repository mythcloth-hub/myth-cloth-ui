import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLanguage, type SupportedLanguage } from "./languages";

export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    (next: SupportedLanguage) => {
      void i18n.changeLanguage(next);
    },
    [i18n],
  );

  return {
    language: normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
    setLanguage,
  };
}
