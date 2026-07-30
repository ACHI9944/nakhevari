import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { Button, Footer, Header } from '../../components'
import { AuthAside, AuthPasswordFields } from '../AuthScreen/components'
import styles from '../AuthScreen/AuthScreen.module.css'

const errorMessages = {
  'auth/weak-password': 'weakPassword',
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const { verifyResetCode, confirmReset } = useAuth()
  const [status, setStatus] = useState(() => (oobCode ? 'verifying' : 'invalid'))
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!oobCode) return
    verifyResetCode(oobCode)
      .then(() => setStatus('valid'))
      .catch(() => setStatus('invalid'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode])

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      if (form.get('password') !== form.get('confirmPassword')) throw { code: 'password-mismatch' }
      await confirmReset(oobCode, form.get('password'))
      setStatus('done')
    } catch (err) {
      setError(
        err.code === 'password-mismatch'
          ? t('auth.errors.mismatch')
          : t(`auth.errors.${errorMessages[err.code] || 'generic'}`),
      )
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
            <button onClick={() => navigate('/auth')} className={styles.backButton}>
              <ArrowLeft size={15} /> {t('auth.backToLogin')}
            </button>
            <h2 className={styles.title}>{t('auth.newPasswordTitle')}</h2>

            {status === 'verifying' && <p className={styles.subtitle}>{t('common.loading')}</p>}

            {status === 'invalid' && (
              <>
                <p className={styles.subtitle}>{t('auth.invalidResetLink')}</p>
                <Button type="button" className={styles.submitButton} onClick={() => navigate('/forgot-password')}>
                  {t('auth.requestNewLink')}
                </Button>
              </>
            )}

            {status === 'done' && (
              <>
                <p className={styles.subtitle}>{t('auth.passwordUpdated')}</p>
                <Button type="button" className={styles.submitButton} onClick={() => navigate('/auth')}>
                  {t('auth.backToLogin')}
                </Button>
              </>
            )}

            {status === 'valid' && (
              <>
                <p className={styles.subtitle}>{t('auth.newPasswordText')}</p>
                <form onSubmit={submit} className={styles.form}>
                  <AuthPasswordFields
                    mode="register"
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(current => !current)}
                    t={t}
                  />
                  {error && <div className={styles.error}>{error}</div>}
                  <Button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? t('common.loading') : t('auth.setNewPassword')}{' '}
                    {!loading && <ArrowRight size={16} />}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
