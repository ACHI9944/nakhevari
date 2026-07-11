import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Logo.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function Logo({ light = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button onClick={() => navigate("/")} className={styles.logo}>
      <span className={styles.mark}>
        ½<span className={styles.dot} />
      </span>
      <span className={cx(styles.text, light && styles.textLight)}>
        {t("brand.first")} <span className={styles.brandText}>{t("brand.second")}</span>
      </span>
    </button>
  );
}
