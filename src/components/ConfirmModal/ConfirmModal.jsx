import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../utils/classNames'
import { Button } from '../Button/Button'
import styles from './ConfirmModal.module.css'

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = event => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
        onClick={event => event.stopPropagation()}
      >
        <h2 id="confirmModalTitle" className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={danger ? 'outline' : 'primary'}
            className={cx(danger && styles.dangerConfirm)}
            onClick={onConfirm}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
