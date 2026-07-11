import { Search } from 'lucide-react'
import styles from '../../AdminScreen.module.css'

export function AdminSearch({ activeTab, onChange, search, t }) {
  if (activeTab === 'admins') return null

  return (
    <label className={styles.search}>
      <Search size={18} className={styles.searchIcon} />
      <input
        value={search}
        onChange={event => onChange(event.target.value)}
        className={styles.searchInput}
        placeholder={t(`admin.searchPlaceholders.${activeTab}`)}
      />
    </label>
  )
}
