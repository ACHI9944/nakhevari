import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DatabaseZap, ShieldCheck } from 'lucide-react'
import { Button, ConfirmModal, Footer, Header } from '../../components'
import { backfillListingSearchFields } from '../../services/listings/listingSearchMaintenanceService'
import {
  changeAdminAccess,
  changeListingPrice,
  changeUserStatus,
  fetchAdminListings,
  fetchAdmins,
  fetchAdminStats,
  fetchProfiles,
  removeListingAdmin,
  reviewListing,
  verifyCompany,
} from '../../store/adminListingsSlice'
import { useAuth } from '../../store/useAuth'
import {
  AdminsTab,
  AdminSearch,
  AdminStatsOverview,
  AdminTabs,
  CompaniesVerificationTab,
  ListingsModerationTab,
  UsersTab,
} from './components'
import { useAdminDashboardData } from './hooks/useAdminDashboardData'
import styles from './AdminScreen.module.css'

const maintenanceBatchLimit = 400

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dispatch = useDispatch()
  const {
    items,
    admins,
    profiles,
    stats,
    status,
    adminsStatus,
    profilesStatus,
    actionStatus,
    statsStatus,
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
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [publicPrice, setPublicPrice] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [companyReason, setCompanyReason] = useState('')
  const [userStatusReason, setUserStatusReason] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminConfirm, setAdminConfirm] = useState(null)
  const [maintenanceCursor, setMaintenanceCursor] = useState('')
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceResult, setMaintenanceResult] = useState(null)
  const [maintenanceError, setMaintenanceError] = useState('')

  useEffect(() => {
    dispatch(fetchAdminListings())
    dispatch(fetchProfiles())
    dispatch(fetchAdmins())
    dispatch(fetchAdminStats())
  }, [dispatch])

  const {
    acting,
    companyCounts,
    loadingListings,
    loadingProfiles,
    listingCounts,
    selected,
    selectedCompany,
    selectedUser,
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
    selectedUserId,
    status,
  })

  const moderate = async nextStatus => {
    if (!selected) return
    if (nextStatus === 'rejected' && !rejectionReason.trim()) return
    if (nextStatus === 'published' && !(Number(publicPrice) > 0)) return
    try {
      await dispatch(reviewListing({
        listingId: selected.id,
        status: nextStatus,
        reason: rejectionReason,
        publicPrice,
      })).unwrap()
      setRejectionReason('')
      setPublicPrice('')
      setSelectedId(null)
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const updatePrice = async () => {
    if (!selected || !(Number(publicPrice) > 0)) return
    try {
      await dispatch(changeListingPrice({ listingId: selected.id, publicPrice })).unwrap()
      setPublicPrice('')
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const deleteSelectedListing = async () => {
    if (!selected || !deleteReason.trim()) return
    if (!window.confirm(t('admin.deleteConfirm'))) return
    try {
      await dispatch(removeListingAdmin({ listingId: selected.id, reason: deleteReason })).unwrap()
      setDeleteReason('')
      setSelectedId(null)
    } catch {
      // The slice exposes the callable error in the dashboard.
    }
  }

  const requestAdminUpdate = (email, enabled) => setAdminConfirm({ email, enabled })

  const confirmAdminUpdate = async () => {
    if (!adminConfirm) return
    const { email, enabled } = adminConfirm
    setAdminConfirm(null)
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

  const updateUserStatus = async nextStatus => {
    if (!selectedUser) return
    if (nextStatus === 'suspended' && !userStatusReason.trim()) return
    try {
      await dispatch(changeUserStatus({ uid: selectedUser.uid, status: nextStatus, reason: userStatusReason })).unwrap()
      setUserStatusReason('')
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
    setDeleteReason('')
    const listing = items.find(item => item.id === id)
    setPublicPrice(listing?.publicPrice ? String(listing.publicPrice) : '')
  }

  const selectCompany = uid => {
    setSelectedCompanyId(uid)
    setCompanyReason('')
  }

  const selectUser = uid => {
    setSelectedUserId(uid)
    setUserStatusReason('')
  }

  const runSearchBackfill = async dryRun => {
    if (!dryRun && !window.confirm(t('admin.maintenanceApplyConfirm', { limit: maintenanceBatchLimit }))) return
    setMaintenanceLoading(true)
    setMaintenanceError('')
    try {
      const result = await backfillListingSearchFields({
        cursor: dryRun ? '' : maintenanceCursor,
        dryRun,
        limit: maintenanceBatchLimit,
      })
      setMaintenanceResult(result)
      setMaintenanceCursor(result.nextCursor || '')
    } catch (error) {
      console.error('admin: search index backfill failed', error)
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

          {activeTab === 'listings' && (
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
          )}

          {activeTab === 'stats' && (
            <AdminStatsOverview loading={statsStatus === 'idle' || statsStatus === 'loading'} stats={stats} t={t} />
          )}

          {activeTab === 'listings' && (
            <ListingsModerationTab
              acting={acting}
              deleteReason={deleteReason}
              error={listingsError}
              filter={filter}
              listingCounts={listingCounts}
              loading={loadingListings}
              onDeleteListing={deleteSelectedListing}
              onDeleteReasonChange={setDeleteReason}
              onFilterChange={changeListingFilter}
              onModerate={moderate}
              onPublicPriceChange={setPublicPrice}
              onRejectionReasonChange={setRejectionReason}
              onSelect={selectListing}
              onUpdatePrice={updatePrice}
              publicPrice={publicPrice}
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
              acting={acting}
              error={profilesError}
              loading={loadingProfiles}
              onSelectUser={selectUser}
              onUpdateUserStatus={updateUserStatus}
              onUserStatusReasonChange={setUserStatusReason}
              selectedUser={selectedUser}
              t={t}
              userStatusReason={userStatusReason}
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
              onUpdateAdmin={requestAdminUpdate}
              t={t}
            />
          )}
        </div>
      </main>
      <ConfirmModal
        open={Boolean(adminConfirm)}
        title={adminConfirm
          ? (adminConfirm.enabled
              ? t('admin.admins.addConfirm', { email: adminConfirm.email })
              : t('admin.admins.removeConfirm', { email: adminConfirm.email }))
          : ''}
        danger={Boolean(adminConfirm && !adminConfirm.enabled)}
        onConfirm={confirmAdminUpdate}
        onCancel={() => setAdminConfirm(null)}
      />
      <Footer />
    </>
  )
}
