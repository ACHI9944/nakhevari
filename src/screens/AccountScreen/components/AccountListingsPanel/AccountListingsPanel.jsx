import { BadgeCheck, CarFront, Clock3, Trash2 } from 'lucide-react'
import { Button } from '../../../../components'
import styles from './AccountListingsPanel.module.css'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export function AccountListingsPanel({
  deletingId,
  error,
  listings,
  loading,
  onAdd,
  onRemove,
  statusLabels,
  t,
}) {
  return (
    <section className={styles.listingsCard}>
      <div className={styles.listingsHeader}>
        <div>
          <h2 className={styles.listingsTitle}>{t('account.myListings')}</h2>
          <p className={styles.listingsSub}>{t('account.subtitle')}</p>
        </div>
        <Button onClick={onAdd}>{t('account.add')}</Button>
      </div>
      {error && <p className={cx(styles.error, styles.listError)}>{error}</p>}
      {loading ? (
        <div className={styles.listLoading}>{t('account.listingsLoading')}</div>
      ) : listings.length ? (
        <div className={styles.listingList}>
          {listings.map(item => (
            <ListingItem
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onRemove={onRemove}
              statusLabels={statusLabels}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <BadgeCheck className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>{t('account.empty')}</h3>
          <p className={styles.emptyText}>{t('account.emptyText')}</p>
        </div>
      )}
    </section>
  )
}

function ListingItem({ deleting, item, onRemove, statusLabels, t }) {
  const statusClass = item.status === 'published'
    ? styles.statusPublished
    : item.status === 'rejected'
      ? styles.statusRejected
      : item.status === 'draft'
        ? styles.statusDraft
        : styles.statusPending

  return (
    <article className={styles.listingItem}>
      <span className={styles.listingIcon}><CarFront size={23} /></span>
      <div className={styles.listingBody}>
        <div className={styles.listingTitleRow}>
          <h3 className={styles.listingTitle}>{item.make} {item.model}</h3>
          <span className={cx(styles.badge, statusClass)}>{statusLabels[item.status] || item.status}</span>
        </div>
        <div className={styles.listingMeta}>
          <span>{item.year}</span>
          <span>${Number(item.price).toLocaleString()}</span>
          <span className={styles.metaWithIcon}><Clock3 size={13} />{item.arrivalDate}</span>
        </div>
        {item.status === 'rejected' && item.rejectionReason && (
          <p className={styles.rejection}>{t('account.rejectionReason', { reason: item.rejectionReason })}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(item.id)}
        disabled={deleting}
        className={styles.deleteButton}
        aria-label={deleting ? t('account.deletingListing') : t('account.deleteListing')}
      >
        <Trash2 size={17} />
      </button>
    </article>
  )
}
