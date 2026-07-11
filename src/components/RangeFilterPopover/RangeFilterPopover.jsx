import { cx } from '../../utils/classNames'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import styles from './RangeFilterPopover.module.css'

export function RangeFilterPopover({
  label,
  value,
  open,
  onToggle,
  onApply,
  icon,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
  unitOptions = [],
  unitValue,
  onUnitChange,
  size = 'compact',
  className = '',
}) {
  const { t } = useTranslation()

  return <div className={cx(styles.root, className)}>
    <span className={styles.label}>{label}</span>
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${label}: ${value}`}
      aria-expanded={open}
      className={cx(styles.button, size === 'large' && styles.buttonLarge, open && styles.buttonOpen)}
    >
      <span className={styles.value}>{value}</span>
      <ChevronDown size={16} className={cx(styles.chevron, open && styles.chevronOpen)} />
    </button>
    {open && <div className={styles.popover}>
      <div className={styles.popoverTop}>
        <div className={styles.icon}>{icon}</div>
        {unitOptions.length > 0 && <div className={styles.unitSwitch}>
          {unitOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUnitChange?.(option.value)}
              aria-pressed={unitValue === option.value}
              className={cx(styles.unitButton, unitValue === option.value && styles.unitButtonActive)}
            >
              {option.labelKey ? t(option.labelKey) : option.label}
            </button>
          ))}
        </div>}
      </div>
      <div className={styles.inputs}>
        <input type="number" min="0" value={minValue} onChange={event => onMinChange(event.target.value)} className={styles.input} placeholder={minPlaceholder} aria-label={minPlaceholder} />
        <input type="number" min="0" value={maxValue} onChange={event => onMaxChange(event.target.value)} className={styles.input} placeholder={maxPlaceholder} aria-label={maxPlaceholder} />
      </div>
      <button type="button" onClick={onApply} className={styles.apply}>{t('listings.apply')}</button>
    </div>}
  </div>
}
