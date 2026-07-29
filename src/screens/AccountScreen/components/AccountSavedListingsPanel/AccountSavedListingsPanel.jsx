import { Link } from 'react-router-dom'
import { BadgeCheck, CarFront, Heart } from 'lucide-react'
import { cx } from '../../../../utils/classNames'
import styles from '../AccountListingsPanel/AccountListingsPanel.module.css'

export function AccountSavedListingsPanel({ error, items, loading, onRemove, removingId, t }) {
  return (
    <section className={styles.listingsCard}>
      <div className={styles.listingsHeader}>
        <div>
          <h2 className={styles.listingsTitle}>{t('account.savedListings')}</h2>
          <p className={styles.listingsSub}>{t('account.savedSubtitle')}</p>
        </div>
      </div>
      {error && <p className={cx(styles.error, styles.listError)}>{error}</p>}
      {loading ? (
        <div className={styles.listLoading}>{t('account.savedListingsLoading')}</div>
      ) : items.length ? (
        <div className={styles.listingList}>
          {items.map(item => (
            <SavedListingItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              removing={removingId === item.id}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <BadgeCheck className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>{t('account.savedEmpty')}</h3>
          <p className={styles.emptyText}>{t('account.savedEmptyText')}</p>
        </div>
      )}
    </section>
  )
}

function SavedListingItem({ item, onRemove, removing, t }) {
  return (
    <article className={styles.listingItem}>
      <Link to={`/listing/${item.id}`} className={styles.listingIcon}>
        <CarFront size={23} />
      </Link>
      <div className={styles.listingBody}>
        <div className={styles.listingTitleRow}>
          <Link to={`/listing/${item.id}`} className={styles.listingTitle}>{item.make} {item.model}</Link>
        </div>
        <div className={styles.listingMeta}>
          <span>{item.year}</span>
          <span>${Number(item.publicPrice).toLocaleString()}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        disabled={removing}
        className={styles.deleteButton}
        aria-label={t('account.removeFavorite')}
      >
        <Heart size={17} fill="currentColor" />
      </button>
    </article>
  )
}
