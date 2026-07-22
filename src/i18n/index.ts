import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";

export const LANGUAGE_MODES = ["auto", "zh-CN", "en-US"] as const;

export type LanguageMode = (typeof LANGUAGE_MODES)[number];
export type SupportedLanguage = Exclude<LanguageMode, "auto">;

const LANGUAGE_MODE_STORAGE_KEY = "localTab.languageMode";

const detectBrowserLanguage = (): SupportedLanguage => {
  const browserLanguage = navigator.languages[0] ?? navigator.language;
  return browserLanguage.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en-US";
};

const LANGUAGE_RESOLVERS: Record<LanguageMode, () => SupportedLanguage> = {
  auto: detectBrowserLanguage,
  "zh-CN": () => "zh-CN",
  "en-US": () => "en-US",
};

export const getLanguageMode = (): LanguageMode => {
  const storedMode = localStorage.getItem(LANGUAGE_MODE_STORAGE_KEY);
  return LANGUAGE_MODES.includes(storedMode as LanguageMode)
    ? (storedMode as LanguageMode)
    : "auto";
};

export const resolveLanguage = (mode: LanguageMode): SupportedLanguage => {
  return LANGUAGE_RESOLVERS[mode]();
};

export const changeLanguageMode = async (mode: LanguageMode): Promise<void> => {
  if (mode === "auto") {
    localStorage.removeItem(LANGUAGE_MODE_STORAGE_KEY);
  } else {
    localStorage.setItem(LANGUAGE_MODE_STORAGE_KEY, mode);
  }

  await i18n.changeLanguage(resolveLanguage(mode));
};

const initialLanguage = resolveLanguage(getLanguageMode());

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en-US",
  supportedLngs: ["zh-CN", "en-US"],
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
});

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language;
};

syncDocumentLanguage(initialLanguage);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
