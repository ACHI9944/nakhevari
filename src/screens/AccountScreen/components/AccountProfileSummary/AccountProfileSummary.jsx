import { Pencil, ShieldCheck, UserRound } from 'lucide-react'
import styles from './AccountProfileSummary.module.css'

export function AccountProfileSummary({ editing, onEdit, profile, t, user }) {
  return (
    <div className={styles.card}>
      <div className={styles.profileHeader}>
        <div className={styles.identity}>
          {user.photoURL
            ? <img src={user.photoURL} alt="" className={styles.avatarImage} />
            : <span className={styles.avatar}><UserRound size={24} /></span>}
          <div>
            <h2 className={styles.name}>{profile?.name || user.displayName || t('account.user')}</h2>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        {!editing && (
          <button type="button" onClick={onEdit} className={styles.iconButton} aria-label={t('account.editProfile')}>
            <Pencil size={17} />
          </button>
        )}
      </div>
      <div className={styles.protected}>
        <ShieldCheck size={17} /> {t('account.protected')}
      </div>
    </div>
  )
}
