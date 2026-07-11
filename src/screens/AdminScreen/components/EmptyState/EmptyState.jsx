import { CheckCircle2 } from 'lucide-react'
import styles from '../../AdminScreen.module.css'

export function EmptyState({ text }) {
  return (
    <div className={styles.empty}>
      <CheckCircle2 className={styles.emptyIcon} size={32} />
      <h2 className={styles.emptyTitle}>{text}</h2>
    </div>
  )
}
