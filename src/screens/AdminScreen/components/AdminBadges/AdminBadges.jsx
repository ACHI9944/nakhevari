import { cx } from '../../../../utils/classNames'
import styles from '../../AdminScreen.module.css'

export function CompanyBadge({ status, t }) {
  const className = status === 'verified'
    ? styles.badgeVerified
    : status === 'rejected'
      ? styles.badgeRejected
      : styles.badgePending

  return <span className={cx(styles.badge, className)}>{t(`account.companyStatus.${status || 'pending'}`)}</span>
}

export function StatusBadge({ status, label }) {
  const className = status === 'published'
    ? styles.badgePublished
    : status === 'rejected'
      ? styles.badgeRejected
      : status === 'draft'
        ? styles.badgeDraft
        : styles.badgePending

  return <span className={cx(styles.badge, className)}>{label}</span>
}
