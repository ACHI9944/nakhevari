import { Building2, Mail, Phone, ShieldOff, ShieldCheck, Users } from 'lucide-react'
import { cx } from '../../../../utils/classNames'
import { Button } from '../../../../components'
import { CompanyBadge } from '../AdminBadges/AdminBadges'
import { EmptyState } from '../EmptyState/EmptyState'
import styles from '../../AdminScreen.module.css'

export function UsersTab({
  acting,
  error,
  loading,
  onSelectUser,
  onUpdateUserStatus,
  onUserStatusReasonChange,
  selectedUser,
  t,
  userStatusReason,
  visibleProfiles,
}) {
  return (
    <>
      {error && <p className={styles.error}>{t('admin.profilesError')}</p>}
      {loading ? (
        <div className={styles.loadingBox}>{t('common.loading')}</div>
      ) : visibleProfiles.length ? (
        <div className={styles.splitGrid}>
          <section className={styles.list}>
            {visibleProfiles.map(profile => (
              <button
                key={profile.uid}
                onClick={() => onSelectUser(profile.uid)}
                className={cx(styles.listButton, selectedUser?.uid === profile.uid && styles.selected)}
              >
                <div className={styles.itemHeader}>
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
                <div className={styles.itemMeta}>
                  <span>{profile.email}</span>
                  <span>{profile.phone || t('listing.missing')}</span>
                  <span>{t(`admin.profileStatus.${profile.profileStatus || 'active'}`)}</span>
                </div>
              </button>
            ))}
          </section>
          {selectedUser && (
            <UserReviewPanel
              acting={acting}
              onUpdateUserStatus={onUpdateUserStatus}
              onUserStatusReasonChange={onUserStatusReasonChange}
              selectedUser={selectedUser}
              t={t}
              userStatusReason={userStatusReason}
            />
          )}
        </div>
      ) : <EmptyState text={t('admin.noUsers')} />}
    </>
  )
}

function UserReviewPanel({ acting, onUpdateUserStatus, onUserStatusReasonChange, selectedUser, t, userStatusReason }) {
  const status = selectedUser.profileStatus || 'active'
  return (
    <aside className={styles.reviewPanel}>
      <div className={styles.asideHeader}>
        <div>
          <span className={styles.reviewEyebrow}>{t('admin.userReview')}</span>
          <h2 className={styles.reviewTitle}>{selectedUser.name || selectedUser.email}</h2>
        </div>
      </div>
      <dl className={styles.detailGrid}>
        {[
          ['email', selectedUser.email],
          ['phone', selectedUser.phone],
          ['profileStatus', t(`admin.profileStatus.${status}`)],
          ['emailVerified', selectedUser.emailVerified ? t('common.yes') : t('common.no')],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className={styles.fieldLabel}>{t(`admin.userFields.${label}`)}</dt>
            <dd className={styles.fieldValue}>{value || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.reviewActions}>
        <textarea
          value={userStatusReason}
          onChange={event => onUserStatusReasonChange(event.target.value)}
          maxLength={500}
          rows={3}
          className={styles.textarea}
          placeholder={t('admin.suspendReason')}
        />
        <div className={styles.buttonGrid}>
          <Button onClick={() => onUpdateUserStatus('active')} disabled={acting || status === 'active'}>
            <ShieldCheck size={17} />{t('admin.reactivateUser')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onUpdateUserStatus('suspended')}
            disabled={acting || !userStatusReason.trim() || status === 'suspended'}
            className={styles.dangerButton}
          >
            <ShieldOff size={17} />{t('admin.suspendUser')}
          </Button>
        </div>
      </div>
    </aside>
  )
}
