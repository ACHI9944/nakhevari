import styles from './AuthModeTabs.module.css'

const modeButtonClass = active =>
  `${styles.modeButton} ${active ? styles.modeButtonActive : styles.modeButtonIdle}`

export function AuthModeTabs({ mode, onChange, t }) {
  return (
    <div className={styles.modeTabs}>
      <button onClick={() => onChange('login')} className={modeButtonClass(mode === 'login')}>
        {t('auth.login')}
      </button>
      <button onClick={() => onChange('register')} className={modeButtonClass(mode === 'register')}>
        {t('auth.register')}
      </button>
    </div>
  )
}
