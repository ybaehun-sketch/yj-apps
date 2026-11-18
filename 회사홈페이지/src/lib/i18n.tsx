import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ko" | "en" | "ja" | "zh-TW" | "fr" | "de" | "es";

const STORAGE_KEY = "yjstudio-lang";
const VALID_LANGS: Language[] = ["ko", "en", "ja", "zh-TW", "fr", "de", "es"];

function isValidLanguage(value: string | null): value is Language {
  return value !== null && VALID_LANGS.includes(value as Language);
}

function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "ko";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (isValidLanguage(saved)) {
    return saved;
  }
  const browserLang = (window.navigator.languages?.[0] ?? window.navigator.language ?? "en").toLowerCase();
  if (browserLang.startsWith("ko")) return "ko";
  if (browserLang.startsWith("ja")) return "ja";
  if (
    browserLang === "zh-tw" ||
    browserLang === "zh-hk" ||
    browserLang === "zh-mo" ||
    browserLang.startsWith("zh-hant")
  ) {
    return "zh-TW";
  }
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("es")) return "es";
  return "en";
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ko",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("ko");

  useEffect(() => {
    const initial = detectBrowserLanguage();
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  function setLang(next: Language) {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
