import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { Button, Footer, Header } from '../../components'
import { AuthAside } from '../AuthScreen/components'
import styles from '../AuthScreen/AuthScreen.module.css'

const errorMessages = {
  'auth/invalid-email': 'invalidEmail',
  'auth/too-many-requests': 'tooMany',
  'auth/network-request-failed': 'network',
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      await resetPassword(form.get('email'))
      setSent(true)
    } catch (err) {
      setError(t(`auth.errors.${errorMessages[err.code] || 'generic'}`))
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
            <h2 className={styles.title}>{t('auth.resetPasswordTitle')}</h2>
            <p className={styles.subtitle}>{t('auth.resetPasswordText')}</p>

            {sent ? (
              <>
                <p className={styles.subtitle}>{t('auth.resetLinkSent')}</p>
                <Button type="button" className={styles.submitButton} onClick={() => navigate('/auth')}>
                  {t('auth.backToLogin')}
                </Button>
              </>
            ) : (
              <form onSubmit={submit} className={styles.form}>
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
                {error && <div className={styles.error}>{error}</div>}
                <Button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? t('common.loading') : t('auth.sendResetLink')}{' '}
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
