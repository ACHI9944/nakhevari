import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, CalendarDays, Check, Phone, UserRound } from 'lucide-react'
import { Button, Footer, Header } from '../../components'
import { useAuth } from '../../store/useAuth'
import { SearchableSelect } from '../../components/SearchableSelect/SearchableSelect'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { isValidGeorgianPhone, normalizeGeorgianPhone } from '../../utils/phone'
import appStyles from '../../app/App.module.css'
import styles from './CompleteProfileScreen.module.css'

export function CompleteProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, profile, profileError, loading, completeProfile } = useAuth()
  const [accountType, setAccountType] = useState('individual')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <div className={styles.loader}>{t('common.loading')}</div>
  if (profileError) {
    return (
      <main className={appStyles.errorMain}>
        <div className={appStyles.errorCard}>
          <h1 className={appStyles.errorTitle}>{t('app.profileErrorTitle')}</h1>
          <p className={appStyles.errorText}>{t('app.profileErrorText')}</p>
          <button type="button" onClick={() => window.location.reload()} className={appStyles.reloadButton}>
            {t('app.reload')}
          </button>
        </div>
      </main>
    )
  }
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.profileCompleted) return <Navigate to="/account" replace />

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    if (accountType === 'individual' && (!gender || !birthDate)) {
      setError(t('filters.requiredFields'))
      setSaving(false)
      return
    }
    const phone = normalizeGeorgianPhone(form.get('phone'))
    if (!isValidGeorgianPhone(phone)) {
      setError(t('auth.errors.invalidPhone'))
      setSaving(false)
      return
    }

    try {
      await completeProfile({
        firstName: form.get('firstName'), lastName: form.get('lastName'), phone, accountType,
        gender, birthDate,
        companyName: form.get('companyName'), identificationNumber: form.get('identificationNumber'),
      })
      navigate('/account', { replace: true })
    } catch (error) {
      console.error('complete-profile: failed to save profile', error)
      setError(t('profileCompletion.error'))
    } finally {
      setSaving(false)
    }
  }

  const nameParts = (user.displayName || '').trim().split(/\s+/)
  const firstName = nameParts.shift() || ''
  const lastName = nameParts.join(' ')

  return <><Header /><main className={styles.main}><form onSubmit={submit} className={styles.form}>
    <span className={styles.icon}><UserRound size={24} /></span>
    <div className={styles.intro}><span className={styles.eyebrow}>{t('profileCompletion.eyebrow')}</span><h1 className={styles.title}>{t('profileCompletion.title')}</h1><p className={styles.description}>{t('profileCompletion.description')}</p></div>
    <div className={styles.grid}><label><span className={styles.label}>{t('auth.firstName')}</span><input name="firstName" className={styles.field} defaultValue={firstName} required /></label><label><span className={styles.label}>{t('auth.lastName')}</span><input name="lastName" className={styles.field} defaultValue={lastName} required /></label></div>
    <div className={styles.section}><span className={styles.label}>{t('auth.accountType')}</span><div className={styles.radioGrid}>{[['individual', UserRound, t('common.individual')], ['company', Building2, t('common.company')]].map(([value, Icon, label]) => <label key={value} className={styles.radioLabel}><input type="radio" name="accountType" value={value} checked={accountType === value} onChange={() => setAccountType(value)} className={styles.radioInput} /><span className={styles.radioCard}><Icon size={16} /> {label}</span></label>)}</div></div>
    <label className={styles.phoneLabel}><span className={styles.label}>{t('auth.phoneNumber')}</span><div className={styles.inputWrap}><Phone size={17} className={styles.phoneIcon} /><input type="tel" name="phone" className={styles.phoneInput} placeholder="+995 5XX XX XX XX" required /></div></label>
    {accountType === 'individual' ? <div className={styles.conditionalGrid}><div><span className={styles.label}>{t('auth.gender')}</span><SearchableSelect name="gender" value={gender} onChange={setGender} searchable={false} placeholder={t('common.select')} options={[{ value: 'male', label: t('auth.male') }, { value: 'female', label: t('auth.female') }, { value: 'other', label: t('auth.otherGender') }]} /></div><div><span className={styles.label}>{t('auth.birthDate')}</span><DatePicker name="birthDate" value={birthDate} onChange={setBirthDate} placeholder={t('auth.birthDate')} /></div></div> : <div className={styles.conditionalGrid}><label><span className={styles.label}>{t('profileCompletion.companyName')}</span><input name="companyName" className={styles.field} required /></label><label><span className={styles.label}>{t('profileCompletion.identificationNumber')}</span><input name="identificationNumber" className={styles.field} inputMode="numeric" required /></label></div>}
    {error && <p className={styles.error}>{error}</p>}
    <Button type="submit" disabled={saving} className={styles.submit}>{saving ? t('profileCompletion.saving') : t('profileCompletion.save')} <Check size={17} /></Button>
  </form></main><Footer /></>
}
