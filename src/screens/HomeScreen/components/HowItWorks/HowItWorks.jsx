import { useTranslation } from 'react-i18next'
import { BadgeCheck, CarFront, Phone } from 'lucide-react'
import styles from './HowItWorks.module.css'

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    [CarFront, t('how.sellerTitle'), t('how.sellerText')],
    [BadgeCheck, t('how.reviewTitle'), t('how.reviewText')],
    [Phone, t('how.contactTitle'), t('how.contactText')],
  ]

  return (
    <div className={styles.grid}>
      {steps.map(([Icon, title, text], i) => (
        <div key={title} className={styles.card}>
          <span className={styles.number}>0{i + 1}</span>
          <span className={styles.icon}>
            <Icon size={23} />
          </span>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.text}>{text}</p>
        </div>
      ))}
    </div>
  )
}
