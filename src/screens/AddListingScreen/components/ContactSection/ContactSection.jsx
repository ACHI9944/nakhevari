import styles from './ContactSection.module.css'

export function ContactSection({ sellerType, t }) {
  const sellerTypeLabel = sellerType === 'company' ? t('common.company') : t('common.individual')

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('add.contact')}</h2>
      <div className={styles.grid}>
        <label>
          <span className={styles.label}>{t('common.name')}</span>
          <input name="sellerName" className={styles.field} required placeholder={t('add.fullName')} />
        </label>
        <label>
          <span className={styles.label}>{t('common.phone')}</span>
          <input name="phone" className={styles.field} required placeholder="+995 5XX XX XX XX" />
        </label>
        <label>
          <span className={styles.label}>{t('add.sellerType')}</span>
          <input type="hidden" name="sellerType" value={sellerType} />
          <div className={styles.field} aria-readonly="true">{sellerType ? sellerTypeLabel : t('add.companyVerificationRequired')}</div>
        </label>
      </div>
    </section>
  )
}
