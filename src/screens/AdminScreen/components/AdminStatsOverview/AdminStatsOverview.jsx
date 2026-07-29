import { BarChart3 } from 'lucide-react'
import styles from '../../AdminScreen.module.css'

const listingRows = ['pending', 'published', 'rejected', 'draft', 'all'].map(key => [key, `admin.status.${key}`])
const userRows = [
  ['active', 'admin.profileStatus.active'],
  ['suspended', 'admin.profileStatus.suspended'],
  ['all', 'admin.status.all'],
]
const companyRows = ['pending', 'verified', 'rejected'].map(key => [key, `account.companyStatus.${key}`])

function StatsRow({ groupTitle, rows, t, values }) {
  return (
    <>
      <h3 className={styles.statsGroupTitle}>{groupTitle}</h3>
      <div className={styles.companyCounts}>
        {rows.map(([key, labelKey]) => (
          <div key={key} className={styles.countCard}>
            <span className={styles.statusLabel}>{t(labelKey)}</span>
            <b className={styles.statusCount}>{values?.[key] ?? 0}</b>
          </div>
        ))}
      </div>
    </>
  )
}

export function AdminStatsOverview({ loading, stats, t }) {
  return (
    <section className={styles.maintenance}>
      <h2 className={styles.maintenanceTitle}><BarChart3 size={18} /> {t('admin.stats.title')}</h2>
      {loading && !stats ? (
        <div className={styles.loadingBox}>{t('common.loading')}</div>
      ) : (
        <>
          <StatsRow groupTitle={t('admin.stats.listings')} rows={listingRows} t={t} values={stats?.listings} />
          <StatsRow groupTitle={t('admin.stats.users')} rows={userRows} t={t} values={stats?.users} />
          <StatsRow groupTitle={t('admin.stats.companies')} rows={companyRows} t={t} values={stats?.companies} />
        </>
      )}
    </section>
  )
}
