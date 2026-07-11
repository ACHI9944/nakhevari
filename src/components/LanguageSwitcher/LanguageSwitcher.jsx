import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const changeLanguage = () =>
    i18n.changeLanguage(i18n.language === "ka" ? "en" : "ka");

  return (
    <button
      type="button"
      onClick={changeLanguage}
      aria-label={t("language.label")}
      className={styles.button}
    >
      <Globe2 size={16} /> {t("language.switch")}
    </button>
  );
}
