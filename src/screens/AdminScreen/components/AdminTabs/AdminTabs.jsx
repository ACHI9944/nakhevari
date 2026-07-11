import { cx } from '../../../../utils/classNames'
import styles from '../../AdminScreen.module.css'

const tabs = ['listings', 'companies', 'users', 'admins']

export function AdminTabs({ activeTab, onChange, t }) {
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cx(styles.tab, activeTab === tab && styles.tabActive)}
        >
          {t(`admin.tabs.${tab}`)}
        </button>
      ))}
    </div>
  )
}
