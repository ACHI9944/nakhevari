import { useTranslation } from "react-i18next";
import { Logo } from "../Logo/Logo";
import styles from "./Footer.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer id="contact" className={styles.footer}>
      <div className={cx(styles.container, styles.main)}>
        <div>
          <Logo light />
          <p className={styles.description}>{t("footer.description")}</p>
        </div>
        <div>
          <h4 className={styles.title}>{t("footer.navigation")}</h4>
          <div className={styles.links}>
            <a href="/#listings">{t("nav.listings")}</a>
            <a href="/#companies">{t("nav.companies")}</a>
          </div>
        </div>
        <div>
          <h4 className={styles.title}>{t("footer.contact")}</h4>
          <div className={styles.links}>
            <span>hello@nakhevari.ge</span>
            <span>+995 32 2 50 50 50</span>
            <span>{t("footer.city")}</span>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={cx(styles.container, styles.bottomInner)}>
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.slogan")}</span>
        </div>
      </div>
    </footer>
  );
}
