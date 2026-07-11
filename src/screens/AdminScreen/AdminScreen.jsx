import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DatabaseZap, ShieldCheck } from 'lucide-react'
import { Button, Footer, Header } from '../../components'
import { backfillListingSearchFields } from '../../services/listings/listingSearchMaintenanceService'
import {
  changeAdminAccess,
  fetchAdminListings,
  fetchAdmins,
  fetchProfiles,
  reviewListing,
  verifyCompany,
} from '../../store/adminListingsSlice'
import { useAuth } from '../../store/useAuth'
import {
  AdminsTab,
  AdminSearch,
  AdminTabs,
  CompaniesVerificationTab,
  ListingsModerationTab,
  UsersTab,
} from './components'
import { useAdminDashboardData } from './hooks/useAdminDashboardData'
import styles from './AdminScreen.module.css'

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dispatch = useDispatch()
  const {
    items,
    admins,
    profiles,
    status,
    adminsStatus,
    profilesStatus,
    actionStatus,
    listingsError,
    adminsError,
    profilesError,
    actionError,
  } = useSelector(state => state.adminListings)
  const [activeTab, setActiveTab] = useState('listings')
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [companyReason, setCompanyReason] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [maintenanceCursor, setMaintenanceCursor] = useState('')
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceResult, setMaintenanceResult] = useState(null)
  const [maintenanceError, setMaintenanceError] = useState('')

  useEffect(() => {
    dispatch(fetchAdminListings())
    dispatch(fetchProfiles())
    dispatch(fetchAdmins())
  }, [dispatch])

  const {
    acting,
    companyCounts,
    loadingListings,
    loadingProfiles,
    listingCounts,
    selected,
    selectedCompany,
    visibleCompanies,
    visibleItems,
    visibleProfiles,
  } = useAdminDashboardData({
    actionStatus,
    filter,
    items,
    profiles,
    profilesStatus,
    search,
    selectedCompanyId,
    selectedId,
    status,
  })

  const moderate = async nextStatus => {
    if (!selected) return
    if (nextStatus === 'rejected' && !rejectionReason.trim()) return
    try {
      await dispatch(reviewListing({ listingId: selected.id, status: nextStatus, reason: rejectionReason })).unwrap()
      setRejectionReason('')
      setSelectedId(null)
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const updateAdmin = async (email, enabled) => {
    try {
      await dispatch(changeAdminAccess({ email, enabled })).unwrap()
      if (enabled) setAdminEmail('')
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const updateCompany = async nextStatus => {
    if (!selectedCompany) return
    if (nextStatus === 'rejected' && !companyReason.trim()) return
    try {
      await dispatch(verifyCompany({ uid: selectedCompany.uid, status: nextStatus, reason: companyReason })).unwrap()
      setCompanyReason('')
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const changeTab = tab => {
    setActiveTab(tab)
    setSearch('')
  }

  const changeListingFilter = nextFilter => {
    setFilter(nextFilter)
    setSelectedId(null)
  }

  const selectListing = id => {
    setSelectedId(id)
    setRejectionReason('')
  }

  const selectCompany = uid => {
    setSelectedCompanyId(uid)
    setCompanyReason('')
  }

  const runSearchBackfill = async dryRun => {
    setMaintenanceLoading(true)
    setMaintenanceError('')
    try {
      const result = await backfillListingSearchFields({
        cursor: dryRun ? '' : maintenanceCursor,
        dryRun,
        limit: 400,
      })
      setMaintenanceResult(result)
      setMaintenanceCursor(result.nextCursor || '')
    } catch {
      setMaintenanceError(t('admin.maintenanceError'))
    } finally {
      setMaintenanceLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>{t('admin.eyebrow')}</span>
              <h1 className={styles.title}>{t('admin.title')}</h1>
              <p className={styles.description}>{t('admin.description')}</p>
            </div>
            <span className={styles.secure}><ShieldCheck size={17} />{t('admin.secure')}</span>
          </div>

          <AdminTabs activeTab={activeTab} onChange={changeTab} t={t} />
          <AdminSearch activeTab={activeTab} onChange={setSearch} search={search} t={t} />
          {actionError && <p className={styles.error}>{t('admin.error')}</p>}

          <section className={styles.maintenance}>
            <div>
              <h2 className={styles.maintenanceTitle}><DatabaseZap size={18} /> {t('admin.maintenanceTitle')}</h2>
              <p className={styles.maintenanceText}>{t('admin.maintenanceText')}</p>
              {maintenanceResult && (
                <p className={styles.maintenanceMeta}>
                  {t('admin.maintenanceResult', {
                    changed: maintenanceResult.changed,
                    checked: maintenanceResult.checked,
                  })}
                  {maintenanceResult.nextCursor ? ` ${t('admin.maintenanceMore')}` : ''}
                </p>
              )}
              {maintenanceError && <p className={styles.maintenanceError}>{maintenanceError}</p>}
            </div>
            <div className={styles.maintenanceActions}>
              <Button type="button" variant="outline" onClick={() => runSearchBackfill(true)} disabled={maintenanceLoading}>
                {maintenanceLoading ? t('common.loading') : t('admin.maintenanceDryRun')}
              </Button>
              <Button type="button" onClick={() => runSearchBackfill(false)} disabled={maintenanceLoading}>
                {maintenanceLoading ? t('common.loading') : t('admin.maintenanceApply')}
              </Button>
            </div>
          </section>

          {activeTab === 'listings' && (
            <ListingsModerationTab
              acting={acting}
              error={listingsError}
              filter={filter}
              listingCounts={listingCounts}
              loading={loadingListings}
              onFilterChange={changeListingFilter}
              onModerate={moderate}
              onRejectionReasonChange={setRejectionReason}
              onSelect={selectListing}
              rejectionReason={rejectionReason}
              selected={selected}
              t={t}
              visibleItems={visibleItems}
            />
          )}

          {activeTab === 'companies' && (
            <CompaniesVerificationTab
              acting={acting}
              companyCounts={companyCounts}
              companyReason={companyReason}
              error={profilesError}
              loading={loadingProfiles}
              onCompanyReasonChange={setCompanyReason}
              onSelectCompany={selectCompany}
              onUpdateCompany={updateCompany}
              selectedCompany={selectedCompany}
              t={t}
              visibleCompanies={visibleCompanies}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              error={profilesError}
              loading={loadingProfiles}
              t={t}
              visibleProfiles={visibleProfiles}
            />
          )}

          {activeTab === 'admins' && (
            <AdminsTab
              acting={acting}
              adminEmail={adminEmail}
              admins={admins}
              adminsStatus={adminsStatus}
              currentUserId={user.uid}
              error={adminsError}
              onAdminEmailChange={setAdminEmail}
              onUpdateAdmin={updateAdmin}
              t={t}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
