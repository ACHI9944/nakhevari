import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/useAuth'
import styles from '../app/App.module.css'

const lazyWithRecovery = (name, loader) => lazy(async () => {
  const recoveryKey = `chunk-recovery:${name}`
  try {
    const module = await loader()
    sessionStorage.removeItem(recoveryKey)
    return module
  } catch (error) {
    if (!sessionStorage.getItem(recoveryKey)) {
      sessionStorage.setItem(recoveryKey, '1')
      window.location.reload()
      return new Promise(() => {})
    }
    sessionStorage.removeItem(recoveryKey)
    throw error
  }
})

const Home = lazyWithRecovery('home', () => import('../screens/HomeScreen/HomeScreen').then(module => ({ default: module.Home })))
const Listings = lazyWithRecovery('listings', () => import('../screens/ListingsScreen/ListingsScreen').then(module => ({ default: module.Listings })))
const AddListing = lazyWithRecovery('add-listing', () => import('../screens/AddListingScreen/AddListingScreen').then(module => ({ default: module.AddListing })))
const AccountPage = lazyWithRecovery('account', () => import('../screens/AccountScreen/AccountScreen').then(module => ({ default: module.AccountPage })))
const AuthPage = lazyWithRecovery('auth', () => import('../screens/AuthScreen/AuthScreen').then(module => ({ default: module.AuthPage })))
const ListingDetail = lazyWithRecovery('listing-detail', () => import('../screens/ListingDetailScreen/ListingDetailScreen').then(module => ({ default: module.ListingDetail })))
const VerifyEmailPage = lazyWithRecovery('verify-email', () => import('../screens/VerifyEmailScreen/VerifyEmailScreen').then(module => ({ default: module.VerifyEmailPage })))
const CompleteProfilePage = lazyWithRecovery('complete-profile', () => import('../screens/CompleteProfileScreen/CompleteProfileScreen').then(module => ({ default: module.CompleteProfilePage })))
const AdminPage = lazyWithRecovery('admin', () => import('../screens/AdminScreen/AdminScreen').then(module => ({ default: module.AdminPage })))

function PageLoader() {
  const { t } = useTranslation()
  return <div className={styles.loader}>{t('app.loading')}</div>
}

function ProfileLoadError() {
  const { t } = useTranslation()
  return (
    <main className={styles.errorMain}>
      <div className={styles.errorCard}>
        <h1 className={styles.errorTitle}>{t('app.profileErrorTitle')}</h1>
        <p className={styles.errorText}>{t('app.profileErrorText')}</p>
        <button type="button" onClick={() => window.location.reload()} className={styles.reloadButton}>
          {t('app.reload')}
        </button>
      </div>
    </main>
  )
}

function RequireVerifiedUser() {
  const { user, profile, profileError, loading } = useAuth()

  if (loading) return <PageLoader />
  if (profileError) return <ProfileLoadError />
  if (!user) return <Navigate to="/auth" replace />
  if (!profile?.profileCompleted) return <Navigate to="/complete-profile" replace />
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />

  return <Outlet />
}

function ListingDetailRoute() {
  const { id } = useParams()
  return <ListingDetail key={id} />
}

function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/account" replace />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/listing/:id" element={<ListingDetailRoute />} />
        <Route element={<RequireVerifiedUser />}>
          <Route path="/add" element={<AddListing />} />
          <Route path="/account" element={<AccountPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
