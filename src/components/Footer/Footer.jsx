import { cx } from '../../utils/classNames'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.css'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer id="contact" className={styles.footer}>
      <div className={cx(styles.container, styles.main)}>
        <div>
          <h4 className={styles.title}>{t('footer.contact')}</h4>
          <div className={styles.links}>
            <span>hello@nakhevari.ge</span>
            <span>+995 32 2 50 50 50</span>
            <span>{t('footer.city')}</span>
          </div>
        </div>
        <div className={styles.legal}>
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.slogan')}</span>
        </div>
      </div>
    </footer>
  )
}
