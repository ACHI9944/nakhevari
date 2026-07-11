import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import styles from './AuthPasswordFields.module.css'

const passwordGridClass = isRegister =>
  `${styles.passwordGrid} ${isRegister ? styles.passwordGridRegister : ''}`

export function AuthPasswordFields({ mode, showPassword, onTogglePassword, t }) {
  return (
    <div className={passwordGridClass(mode === 'register')}>
      <label>
        <span className={styles.label}>{t('common.password')}</span>
        <div className={styles.inputWrap}>
          <LockKeyhole size={17} className={styles.inputIcon} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className={styles.passwordInput}
            minLength="6"
            required
          />
          <button type="button" onClick={onTogglePassword} className={styles.passwordToggle}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>
      {mode === 'register' && (
        <label>
          <span className={styles.label}>{t('auth.confirmPassword')}</span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            className={styles.field}
            minLength="6"
            required
          />
        </label>
      )}
    </div>
  )
}
