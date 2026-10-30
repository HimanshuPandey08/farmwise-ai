"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, COOKIE_NAME } from "@/i18n/config";

// Statically import translation dictionaries
import en from "@/i18n/locales/en.json";
import hi from "@/i18n/locales/hi.json";
import mr from "@/i18n/locales/mr.json";
import pa from "@/i18n/locales/pa.json";
import bn from "@/i18n/locales/bn.json";
import ta from "@/i18n/locales/ta.json";
import te from "@/i18n/locales/te.json";
import gu from "@/i18n/locales/gu.json";
import kn from "@/i18n/locales/kn.json";
import ml from "@/i18n/locales/ml.json";
import orLocale from "@/i18n/locales/or.json";

export const TRANSLATIONS = {
  en,
  hi,
  mr,
  pa,
  bn,
  ta,
  te,
  gu,
  kn,
  ml,
  or: orLocale,
};

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, fallbackOrVars, vars) => (typeof fallbackOrVars === "string" ? fallbackOrVars : key),
  supportedLanguages: SUPPORTED_LANGUAGES,
});

function setCookie(name, value, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function LanguageProvider({ children, initialLanguage = DEFAULT_LANGUAGE }) {
  const router = useRouter();
  // Server-rendered initialLanguage ensures 100% hydration matching between SSR and Client VDOM
  const [language, setLanguageState] = useState(initialLanguage);
  const [prevInitial, setPrevInitial] = useState(initialLanguage);

  if (prevInitial !== initialLanguage) {
    setPrevInitial(initialLanguage);
    if (initialLanguage && TRANSLATIONS[initialLanguage]) {
      setLanguageState(initialLanguage);
    }
  }

  const setLanguage = useCallback((newLang) => {
    if (!TRANSLATIONS[newLang]) return;
    setLanguageState(newLang);
    setCookie(COOKIE_NAME, newLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
    // Refresh server components to re-run with the updated cookie
    router.refresh();
  }, [router]);

  /**
   * Translate a nested key with fallback and optional variable interpolation
   * Usage:
   *   t("common.home") -> "Home"
   *   t("common.home", "Home") -> "Home"
   *   t("marketplace.showingCount", { count: 5 }) -> "Showing 5 listings"
   *   t("marketplace.showingCount", "Showing {count} items", { count: 5 }) -> "Showing 5 items"
   */
  const t = useCallback((path, fallbackOrVariables, variables) => {
    if (!path) return "";

    let fallback = "";
    let vars = null;

    if (typeof fallbackOrVariables === "string") {
      fallback = fallbackOrVariables;
      if (variables && typeof variables === "object") {
        vars = variables;
      }
    } else if (fallbackOrVariables && typeof fallbackOrVariables === "object") {
      vars = fallbackOrVariables;
      fallback = path;
    } else {
      fallback = fallbackOrVariables !== undefined ? fallbackOrVariables : path;
    }

    const keys = path.split(".");

    // 1. Traverse active language dictionary
    let current = TRANSLATIONS[language];
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    let result = typeof current === "string" ? current : undefined;

    // 2. Fallback to English dictionary if missing in active language
    if (result === undefined) {
      let enFallback = TRANSLATIONS.en;
      for (const k of keys) {
        if (enFallback && typeof enFallback === "object" && k in enFallback) {
          enFallback = enFallback[k];
        } else {
          enFallback = undefined;
          break;
        }
      }
      if (typeof enFallback === "string") {
        result = enFallback;
      }
    }

    if (result === undefined) {
      result = fallback;
    }

    // 3. Interpolate variables {varName} or {{varName}}
    if (vars && typeof vars === "object" && typeof result === "string") {
      for (const key of Object.keys(vars)) {
        const val = vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : "";
        result = result.replace(new RegExp(`\\{\\{?\\s*${key}\\s*\\}?}`, "g"), val);
      }
    }

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
