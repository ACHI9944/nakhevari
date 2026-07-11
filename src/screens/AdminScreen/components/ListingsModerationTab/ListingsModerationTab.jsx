import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Button } from '../../../../components'
import { StatusBadge } from '../AdminBadges/AdminBadges'
import { EmptyState } from '../EmptyState/EmptyState'
import styles from '../../AdminScreen.module.css'

const cx = (...classes) => classes.filter(Boolean).join(' ')
const listingStatuses = ['pending', 'published', 'rejected', 'draft', 'all']

export function ListingsModerationTab({
  acting,
  error,
  filter,
  listingCounts,
  loading,
  onFilterChange,
  onModerate,
  onRejectionReasonChange,
  onSelect,
  rejectionReason,
  selected,
  t,
  visibleItems,
}) {
  return (
    <>
      {error && <p className={styles.error}>{t('admin.error')}</p>}
      <div className={styles.statusGrid}>
        {listingStatuses.map(item => (
          <button
            key={item}
            onClick={() => onFilterChange(item)}
            className={cx(styles.statusButton, filter === item && styles.statusButtonActive)}
          >
            <span className={styles.statusLabel}>{t(`admin.status.${item}`)}</span>
            <b className={styles.statusCount}>{listingCounts[item]}</b>
          </button>
        ))}
      </div>
      {loading ? (
        <div className={styles.loadingBox}>{t('common.loading')}</div>
      ) : visibleItems.length ? (
        <div className={styles.splitGrid}>
          <section className={styles.list}>
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cx(styles.listButton, selected?.id === item.id && styles.selected)}
              >
                <div className={styles.itemHeader}>
                  <div>
                    <h2 className={styles.itemTitle}>{item.make} {item.model}</h2>
                    <p className={styles.itemSub}>{item.vin}</p>
                  </div>
                  <StatusBadge status={item.status} label={t(`admin.status.${item.status}`)} />
                </div>
                <div className={styles.itemMeta}>
                  <span>{item.year}</span>
                  <span>${Number(item.price).toLocaleString()}</span>
                  <span>{item.sellerName}</span>
                </div>
              </button>
            ))}
          </section>
          {selected && (
            <ListingReviewPanel
              acting={acting}
              onModerate={onModerate}
              onRejectionReasonChange={onRejectionReasonChange}
              rejectionReason={rejectionReason}
              selected={selected}
              t={t}
            />
          )}
        </div>
      ) : <EmptyState text={t('admin.empty')} />}
    </>
  )
}

function ListingReviewPanel({ acting, onModerate, onRejectionReasonChange, rejectionReason, selected, t }) {
  return (
    <aside className={styles.reviewPanel}>
      <div className={styles.asideHeader}>
        <div>
          <span className={styles.reviewEyebrow}>{t('admin.review')}</span>
          <h2 className={styles.reviewTitle}>{selected.make} {selected.model}</h2>
        </div>
        <span className={styles.yearBadge}>{selected.year}</span>
      </div>
      <dl className={styles.detailGrid}>
        {[
          ['vin', selected.vin],
          ['price', `$${Number(selected.price).toLocaleString()}`],
          ['mileage', Number(selected.mileage).toLocaleString()],
          ['arrival', selected.arrivalDate],
          ['seller', selected.sellerName],
          ['phone', selected.phone],
          ['email', selected.ownerEmail],
          ['transport', selected.transportStatus],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className={styles.fieldLabel}>{t(`admin.fields.${label}`)}</dt>
            <dd className={styles.fieldValue}>{value || '—'}</dd>
          </div>
        ))}
      </dl>
      {selected.damageDescription && (
        <div className={styles.damage}>
          <h3 className={styles.damageTitle}>{t('admin.fields.damage')}</h3>
          <p className={styles.damageText}>{selected.damageDescription}</p>
        </div>
      )}
      {selected.status === 'pending' && (
        <div className={styles.reviewActions}>
          <textarea
            value={rejectionReason}
            onChange={event => onRejectionReasonChange(event.target.value)}
            maxLength={500}
            rows={3}
            className={styles.textarea}
            placeholder={t('admin.reason')}
          />
          <div className={styles.buttonGrid}>
            <Button onClick={() => onModerate('published')} disabled={acting}>
              <CheckCircle2 size={17} />{t('admin.publish')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onModerate('rejected')}
              disabled={acting || !rejectionReason.trim()}
              className={styles.dangerButton}
            >
              <XCircle size={17} />{t('admin.reject')}
            </Button>
          </div>
        </div>
      )}
      {selected.status !== 'pending' && (
        <div className={styles.reviewed}>
          <Clock3 size={16} />{t('admin.reviewed')}
        </div>
      )}
    </aside>
  )
}
