import { Building2, Mail, Phone, Users } from 'lucide-react'
import { CompanyBadge } from '../AdminBadges/AdminBadges'
import { EmptyState } from '../EmptyState/EmptyState'
import styles from '../../AdminScreen.module.css'

export function UsersTab({ error, loading, t, visibleProfiles }) {
  return (
    <>
      {error && <p className={styles.error}>{t('admin.profilesError')}</p>}
      {loading ? (
        <div className={styles.loadingBox}>{t('common.loading')}</div>
      ) : visibleProfiles.length ? (
        <section className={styles.userGrid}>
          {visibleProfiles.map(profile => (
            <article key={profile.uid} className={styles.userCard}>
              <div className={styles.userHeader}>
                <div className={styles.identity}>
                  <span className={styles.avatar}>
                    {profile.accountType === 'company' ? <Building2 size={20} /> : <Users size={20} />}
                  </span>
                  <div>
                    <h2 className={styles.itemTitle}>{profile.name || profile.email}</h2>
                    <p className={styles.itemSub}>{profile.accountType === 'company' ? t('common.company') : t('common.individual')}</p>
                  </div>
                </div>
                {profile.accountType === 'company' && <CompanyBadge status={profile.companyVerificationStatus} t={t} />}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.metaLine}><Mail size={14} />{profile.email}</span>
                <span className={styles.metaLine}><Phone size={14} />{profile.phone || t('listing.missing')}</span>
                {profile.companyName && <span className={styles.metaLine}><Building2 size={14} />{profile.companyName}</span>}
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState text={t('admin.noUsers')} />}
    </>
  )
}
