import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LogOut,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Footer, Header } from '../../components'
import { useAuth } from '../../store/useAuth'
import { deleteListing, fetchMyListings } from '../../store/listingsSlice'
import { AccountListingsPanel, AccountProfileDetails, AccountProfileSummary } from './components'
import styles from './AccountScreen.module.css'

const normalizePhone = value => {
  let phone = String(value || '').replace(/[\s()-]/g, '')
  if (/^5\d{8}$/.test(phone)) phone = `+995${phone}`
  return phone
}

export function AccountPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, profile, logout, completeProfile } = useAuth()
  const dispatch = useDispatch()
  const { items: listings, status, error } = useSelector(state => state.listings.mine)
  const listingsLoading = status === 'idle' || status === 'loading'
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [accountType, setAccountType] = useState(profile?.accountType || 'individual')
  const [gender, setGender] = useState(profile?.gender || '')
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '')

  useEffect(() => { dispatch(fetchMyListings(user.uid)) }, [dispatch, user.uid])

  const statusLabels = useMemo(() => ({
    pending: t('account.listingStatus.pending'),
    published: t('account.listingStatus.published'),
    rejected: t('account.listingStatus.rejected'),
    draft: t('account.listingStatus.draft'),
  }), [t])

  const companyStatus = profile?.companyVerificationStatus || (profile?.accountType === 'company' ? 'pending' : 'not_required')

  const leave = async () => {
    await logout()
    navigate('/')
  }

  const remove = async id => {
    if (!window.confirm(t('account.deleteConfirm'))) return
    setDeleteError('')
    setDeletingId(id)
    try {
      await dispatch(deleteListing(id)).unwrap()
    } catch {
      setDeleteError(t('account.deleteError'))
    } finally {
      setDeletingId('')
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setFormError('')
  }

  const beginEdit = () => {
    setAccountType(profile?.accountType || 'individual')
    setGender(profile?.gender || '')
    setBirthDate(profile?.birthDate || '')
    setFormError('')
    setEditing(true)
  }

  const submitProfile = async event => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const form = new FormData(event.currentTarget)
    if (accountType === 'individual' && (!gender || !birthDate)) {
      setFormError(t('filters.requiredFields'))
      setSaving(false)
      return
    }

    const phone = normalizePhone(form.get('phone'))
    if (!/^\+9955\d{8}$/.test(phone)) {
      setFormError(t('auth.errors.invalidPhone'))
      setSaving(false)
      return
    }

    try {
      await completeProfile({
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        phone,
        accountType,
        gender,
        birthDate,
        companyName: form.get('companyName') || '',
        identificationNumber: form.get('identificationNumber') || '',
      })
      setEditing(false)
    } catch {
      setFormError(t('profileCompletion.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>{t('account.area')}</span>
              <h1 className={styles.title}>{t('account.greeting', { name: profile?.name || user.displayName || t('account.user') })}</h1>
              <p className={styles.intro}>{t('account.intro')}</p>
            </div>
            <Button variant="outline" onClick={leave}><LogOut size={16} /> {t('common.logout')}</Button>
          </div>

          <div className={styles.layout}>
            <section className={styles.sidebar}>
              <AccountProfileSummary
                editing={editing}
                onEdit={beginEdit}
                profile={profile}
                t={t}
                user={user}
              />
              <AccountProfileDetails
                accountType={accountType}
                birthDate={birthDate}
                companyStatus={companyStatus}
                editing={editing}
                formError={formError}
                gender={gender}
                onAccountTypeChange={setAccountType}
                onBirthDateChange={setBirthDate}
                onCancel={cancelEdit}
                onGenderChange={setGender}
                onSubmit={submitProfile}
                profile={profile}
                saving={saving}
                t={t}
                user={user}
              />
            </section>

            <AccountListingsPanel
              deletingId={deletingId}
              error={deleteError || (error ? t('account.listingsError') : '')}
              listings={listings}
              loading={listingsLoading}
              onAdd={() => navigate('/add')}
              onRemove={remove}
              statusLabels={statusLabels}
              t={t}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
