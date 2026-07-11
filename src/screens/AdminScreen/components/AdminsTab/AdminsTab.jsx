import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '../../../../components'
import styles from '../../AdminScreen.module.css'

export function AdminsTab({
  acting,
  adminEmail,
  admins,
  adminsStatus,
  currentUserId,
  error,
  onAdminEmailChange,
  onUpdateAdmin,
  t,
}) {
  return (
    <>
      {error && <p className={styles.error}>{t('admin.error')}</p>}
      <section className={styles.adminPanel}>
        <div className={styles.adminHeader}>
          <div>
            <h2 className={styles.adminTitle}>{t('admin.admins.title')}</h2>
            <p className={styles.adminDescription}>{t('admin.admins.description')}</p>
          </div>
          <form
            onSubmit={event => {
              event.preventDefault()
              onUpdateAdmin(adminEmail, true)
            }}
            className={styles.adminForm}
          >
            <input
              type="email"
              required
              value={adminEmail}
              onChange={event => onAdminEmailChange(event.target.value)}
              className={styles.field}
              placeholder={t('admin.admins.email')}
            />
            <Button type="submit" disabled={acting}>
              <UserPlus size={16} />{t('admin.admins.add')}
            </Button>
          </form>
        </div>
        <div className={styles.adminList}>
          {adminsStatus === 'loading' ? (
            <span className={styles.muted}>{t('common.loading')}</span>
          ) : admins.map(admin => (
            <span key={admin.uid} className={styles.adminChip}>
              <ShieldCheck size={14} className={styles.brandIcon} />
              {admin.email}
              <button
                type="button"
                onClick={() => onUpdateAdmin(admin.email, false)}
                disabled={acting || admin.uid === currentUserId}
                title={admin.uid === currentUserId ? t('admin.admins.self') : t('admin.admins.remove')}
                className={styles.removeAdmin}
              >
                <UserMinus size={15} />
              </button>
            </span>
          ))}
        </div>
      </section>
    </>
  )
}
