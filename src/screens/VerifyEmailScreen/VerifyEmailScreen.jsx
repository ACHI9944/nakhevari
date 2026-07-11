import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Mail } from 'lucide-react'
import { Button, Footer, Header } from '../../components'
import { useAuth } from '../../store/useAuth'
import styles from './VerifyEmailScreen.module.css'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, loading, refreshUser, resendEmailVerification, logout } = useAuth()
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  if (loading) return <div className={styles.loader}>{t('common.loading')}</div>
  if (!user) return <Navigate to="/auth" replace />
  if (user.emailVerified) return <Navigate to="/account" replace />

  const checkStatus = async () => {
    setChecking(true)
    setMessage('')
    try {
      const refreshed = await refreshUser()
      if (refreshed?.user?.emailVerified) navigate('/account')
      else setMessage(t('verify.notConfirmed'))
    } catch (error) {
      console.error('verify-email: failed to check status', error)
      setMessage(t('verify.checkError'))
    } finally {
      setChecking(false)
    }
  }
  const resend = async () => {
    try {
      await resendEmailVerification()
      setMessage(t('verify.resent'))
    } catch (error) {
      console.error('verify-email: failed to resend', error)
      setMessage(t('verify.resendError'))
    }
  }
  const leave = async () => { await logout(); navigate('/auth') }

  return <><Header/><main className={styles.main}><section className={styles.card}><span className={styles.icon}><Mail size={28}/></span><span className={styles.eyebrow}>{t('verify.eyebrow')}</span><h1 className={styles.title}>{t('verify.title')}</h1><p className={styles.text}>{t('verify.sent')}<br/><b className={styles.email}>{user.email}</b></p><div className={styles.hint}>{t('verify.hint')}</div>{message&&<p className={styles.message}>{message}</p>}<Button onClick={checkStatus} disabled={checking} className={styles.checkButton}>{checking?t('verify.checking'):t('verify.check')} <Check size={16}/></Button><button onClick={resend} className={styles.resendButton}>{t('verify.resend')}</button><button onClick={leave} className={styles.leaveButton}>{t('verify.other')}</button></section></main><Footer/></>
}
