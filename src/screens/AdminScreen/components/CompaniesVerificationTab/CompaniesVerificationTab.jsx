import { cx } from '../../../../utils/classNames'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../../../../components'
import { CompanyBadge } from '../AdminBadges/AdminBadges'
import { EmptyState } from '../EmptyState/EmptyState'
import styles from '../../AdminScreen.module.css'

const companyStatuses = ['pending', 'verified', 'rejected']

export function CompaniesVerificationTab({
  acting,
  companyCounts,
  companyReason,
  error,
  loading,
  onCompanyReasonChange,
  onSelectCompany,
  onUpdateCompany,
  selectedCompany,
  t,
  visibleCompanies,
}) {
  return (
    <>
      {error && <p className={styles.error}>{t('admin.profilesError')}</p>}
      <div className={styles.companyCounts}>
        {companyStatuses.map(item => (
          <div key={item} className={styles.countCard}>
            <span className={styles.statusLabel}>{t(`account.companyStatus.${item}`)}</span>
            <b className={styles.statusCount}>{companyCounts[item]}</b>
          </div>
        ))}
      </div>
      {loading ? (
        <div className={styles.loadingBox}>{t('common.loading')}</div>
      ) : visibleCompanies.length ? (
        <div className={styles.splitGrid}>
          <section className={styles.list}>
            {visibleCompanies.map(company => (
              <button
                key={company.uid}
                onClick={() => onSelectCompany(company.uid)}
                className={cx(styles.listButton, selectedCompany?.uid === company.uid && styles.selected)}
              >
                <div className={styles.itemHeader}>
                  <div>
                    <h2 className={styles.itemTitle}>{company.companyName || company.name || company.email}</h2>
                    <p className={styles.itemSub}>{company.identificationNumber || company.email}</p>
                  </div>
                  <CompanyBadge status={company.companyVerificationStatus} t={t} />
                </div>
                <div className={styles.itemMeta}>
                  <span>{company.name}</span>
                  <span>{company.phone}</span>
                  <span>{company.email}</span>
                </div>
              </button>
            ))}
          </section>
          {selectedCompany && (
            <CompanyReviewPanel
              acting={acting}
              companyReason={companyReason}
              onCompanyReasonChange={onCompanyReasonChange}
              onUpdateCompany={onUpdateCompany}
              selectedCompany={selectedCompany}
              t={t}
            />
          )}
        </div>
      ) : <EmptyState text={t('admin.noCompanies')} />}
    </>
  )
}

function CompanyReviewPanel({ acting, companyReason, onCompanyReasonChange, onUpdateCompany, selectedCompany, t }) {
  return (
    <aside className={styles.reviewPanel}>
      <div className={styles.asideHeader}>
        <div>
          <span className={styles.reviewEyebrow}>{t('admin.companyReview')}</span>
          <h2 className={styles.reviewTitle}>{selectedCompany.companyName || t('listing.missing')}</h2>
        </div>
        <CompanyBadge status={selectedCompany.companyVerificationStatus} t={t} />
      </div>
      <dl className={styles.detailGrid}>
        {[
          ['owner', selectedCompany.name],
          ['email', selectedCompany.email],
          ['phone', selectedCompany.phone],
          ['idNumber', selectedCompany.identificationNumber],
          ['profileStatus', t(`admin.profileStatus.${selectedCompany.profileStatus || 'active'}`)],
          ['emailVerified', selectedCompany.emailVerified ? t('common.yes') : t('common.no')],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className={styles.fieldLabel}>{t(`admin.userFields.${label}`)}</dt>
            <dd className={styles.fieldValue}>{value || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.reviewActions}>
        <textarea
          value={companyReason}
          onChange={event => onCompanyReasonChange(event.target.value)}
          maxLength={500}
          rows={3}
          className={styles.textarea}
          placeholder={t('admin.companyReason')}
        />
        <div className={styles.buttonGrid}>
          <Button onClick={() => onUpdateCompany('verified')} disabled={acting || selectedCompany.companyVerificationStatus === 'verified'}>
            <CheckCircle2 size={17} />{t('admin.verifyCompany')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onUpdateCompany('rejected')}
            disabled={acting || !companyReason.trim() || selectedCompany.companyVerificationStatus === 'rejected'}
            className={styles.dangerButton}
          >
            <XCircle size={17} />{t('admin.rejectCompany')}
          </Button>
        </div>
      </div>
    </aside>
  )
}
