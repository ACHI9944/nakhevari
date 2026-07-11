import { CarFront, Check } from 'lucide-react'
import styles from './AuthAside.module.css'

export function AuthAside({ t }) {
  return (
    <aside className={styles.aside}>
      <div className={styles.asideGlow} />
      <div className={styles.asideContent}>
        <span className={styles.asideIcon}>
          <CarFront />
        </span>
        <h1 className={styles.asideTitle}>
          {t('auth.cars')}
          <br />
          <span className={styles.brandText}>{t('auth.space')}</span>
        </h1>
        <p className={styles.asideText}>{t('auth.intro')}</p>
        <div className={styles.asideList}>
          {[t('auth.verifiedPhone'), t('auth.manageListings'), t('auth.protectedData')].map(item => (
            <div key={item} className={styles.asideListItem}>
              <span className={styles.asideListIcon}>
                <Check size={14} />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
