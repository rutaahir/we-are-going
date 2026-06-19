import { useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import en from "../locales/en.json";
import gu from "../locales/gu.json";
import hi from "../locales/hi.json";

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  gu: gu as Record<string, string>,
  hi: hi as Record<string, string>,
};

export function cleanKey(key: string): string {
  return key;
}

export function useTranslation() {
  const { language } = useLanguage();

  const t = useCallback(
    (key: string): string => {
      const langDict = translations[language];
      if (langDict && langDict[key] !== undefined) {
        return langDict[key];
      }

      const enDict = translations["en"];
      if (enDict && enDict[key] !== undefined) {
        return enDict[key];
      }

      return cleanKey(key);
    },
    [language]
  );

  return { t };
}
