import { cx } from '../../utils/classNames'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../../store/useAuth";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../Button/Button";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { Logo } from "../Logo/Logo";
import styles from "./Header.module.css";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const links = [
    [t("nav.home"), "/#home"],
    [t("nav.listings"), "/listings"],
    [t("nav.companies"), "/#companies"],
    [t("nav.contact"), "/#contact"],
  ];

  const go = (href) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <header className={styles.header}>
      <div className={cx(styles.container, styles.inner)}>
        <Logo />
        <nav className={styles.desktopNav}>
          {links.map(([label, href]) => (
            <button key={href} onClick={() => go(href)} className={styles.navLink}>
              {label}
            </button>
          ))}
        </nav>
        <div className={styles.actions}>
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className={styles.adminLink}>
              {t("nav.admin")}
            </button>
          )}
          <Button
            onClick={() => navigate(user ? "/account" : "/auth")}
            className={styles.desktopProfileButton}
          >
            {user ? t("nav.profile") : t("nav.login")} <ArrowRight size={16} />
          </Button>
          <button
            aria-label={t("common.menu")}
            onClick={() => setOpen(!open)}
            className={styles.menuButton}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          <button
            type="button"
            aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            onClick={toggleTheme}
            className={styles.themeButton}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
      {open && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            {links.map(([label, href]) => (
              <button key={label} onClick={() => go(href)} className={styles.mobileNavLink}>
                {label}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => go("/admin")} className={styles.mobileAdminLink}>
                {t("nav.admin")}
              </button>
            )}
            <Button
              onClick={() => go(user ? "/account" : "/auth")}
              className={styles.mobileProfileButton}
            >
              {user ? t("nav.profile") : t("common.accountAccess")} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
