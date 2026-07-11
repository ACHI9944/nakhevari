import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, ka } from "./resources";

export const supportedLanguages = ["ka", "en"];
const savedLanguage = localStorage.getItem("selectedLanguage");
const initialLanguage = supportedLanguages.includes(savedLanguage)
  ? savedLanguage
  : "ka";

i18n.use(initReactI18next).init({
  resources: { ka: { common: ka }, en: { common: en } },
  lng: initialLanguage,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("selectedLanguage", language);
  document.documentElement.lang = language;
});

document.documentElement.lang = initialLanguage;

export default i18n;
