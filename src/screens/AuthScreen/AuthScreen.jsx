import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { Button, Footer, Header } from '../../components'
import { isValidGeorgianPhone, normalizeGeorgianPhone } from '../../utils/phone'
import {
  AuthAside,
  AuthModeTabs,
  AuthPasswordFields,
  AuthRegisterFields,
  AuthSocialLogin,
} from './components'
import styles from './AuthScreen.module.css'

const errorMessages = {
  'auth/email-already-in-use': 'emailInUse',
  'auth/invalid-email': 'invalidEmail',
  'auth/weak-password': 'weakPassword',
  'auth/invalid-credential': 'invalidCredential',
  'auth/too-many-requests': 'tooMany',
  'auth/network-request-failed': 'network',
  'auth/popup-closed-by-user': 'popupClosed',
  'auth/popup-blocked': 'popupBlocked',
  'auth/account-exists-with-different-credential': 'differentCredential',
  'auth/configuration-not-found': 'config',
  'auth/invalid-verification-code': 'invalidCode',
  'auth/code-expired': 'codeExpired',
  'auth/invalid-phone-number': 'invalidPhone',
  'auth/captcha-check-failed': 'captcha',
  'auth/billing-not-enabled': 'billing',
  'auth/quota-exceeded': 'quota',
}

export function AuthPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { login, loginWithGoogle, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [accountType, setAccountType] = useState('individual')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const changeMode = nextMode => {
    setMode(nextMode)
    setError('')
  }

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      if (mode === 'register') {
        if (accountType === 'individual' && (!gender || !birthDate)) throw { code: 'required-fields' }
        if (form.get('password') !== form.get('confirmPassword')) throw { code: 'password-mismatch' }

        const phone = normalizeGeorgianPhone(form.get('phone'))
        if (!isValidGeorgianPhone(phone)) throw { code: 'auth/invalid-phone-number' }

        await register({
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          email: form.get('email'),
          password: form.get('password'),
          accountType: form.get('accountType'),
          gender,
          birthDate,
          companyName: form.get('companyName'),
          identificationNumber: form.get('identificationNumber'),
          phone,
        })
        navigate('/verify-email')
        return
      }

      await login(form.get('email'), form.get('password'))
      navigate('/account')
    } catch (err) {
      setError(
        err.code === 'password-mismatch'
          ? t('auth.errors.mismatch')
          : err.code === 'required-fields'
            ? t('filters.requiredFields')
            : t(`auth.errors.${errorMessages[err.code] || 'generic'}`),
      )
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
      navigate('/account')
    } catch (err) {
      setError(t(`auth.errors.${errorMessages[err.code] || 'google'}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.shell}>
          <AuthAside t={t} />
          <section className={styles.content}>
            <button onClick={() => navigate('/')} className={styles.backButton}>
              <ArrowLeft size={15} /> {t('auth.back')}
            </button>
            <span className={styles.eyebrow}>
              {mode === 'login' ? t('auth.welcome') : t('auth.secure')}
            </span>
            <h2 className={styles.title}>{mode === 'login' ? t('auth.login') : t('auth.register')}</h2>
            <p className={styles.subtitle}>{mode === 'login' ? t('auth.loginText') : t('auth.registerText')}</p>

            <AuthModeTabs mode={mode} onChange={changeMode} t={t} />
            <AuthSocialLogin loading={loading} onGoogleLogin={googleLogin} t={t} />

            <form onSubmit={submit} className={styles.form}>
              {mode === 'register' && (
                <AuthRegisterFields
                  accountType={accountType}
                  birthDate={birthDate}
                  gender={gender}
                  onAccountTypeChange={setAccountType}
                  onBirthDateChange={setBirthDate}
                  onGenderChange={setGender}
                  t={t}
                />
              )}
              <label>
                <span className={styles.label}>{t('common.email')}</span>
                <div className={styles.inputWrap}>
                  <Mail size={17} className={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    className={styles.iconInput}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </label>
              <AuthPasswordFields
                mode={mode}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(current => !current)}
                t={t}
              />
              {error && <div className={styles.error}>{error}</div>}
              <Button type="submit" className={styles.submitButton} disabled={loading}>
                {loading
                  ? t('common.loading')
                  : mode === 'login'
                    ? t('auth.login')
                    : t('auth.createAccount')}{' '}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>
            <p className={styles.terms}>{t('auth.terms')}</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
