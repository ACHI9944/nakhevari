import { ImagePlus, X } from 'lucide-react'
import styles from './ConditionSection.module.css'

export function ConditionSection({
  addPhotos,
  maxPhotos,
  photoInput,
  photos,
  removePhoto,
  t,
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('add.condition')}</h2>
      <label>
        <span className={styles.label}>{t('add.damage')}</span>
        <textarea
          name="damageDescription"
          rows="5"
          className={styles.textarea}
          placeholder={t('add.damagePlaceholder')}
        />
      </label>
      <div className={styles.photosBlock}>
        <span className={styles.label}>{t('add.photos')}</span>
        {photos.length > 0 && (
          <div className={styles.photosGrid}>
            {photos.map((photo, index) => (
              <div key={photo.preview} className={styles.photoPreview}>
                <img src={photo.preview} alt={t('add.photoPreview', { number: index + 1 })} className={styles.photoImage} />
                {index === 0 && <span className={styles.coverBadge}>{t('add.coverPhoto')}</span>}
                <button type="button" onClick={() => removePhoto(index)} aria-label={t('add.removePhoto')} className={styles.removePhoto}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className={styles.fileInput} onChange={addPhotos} />
        <button type="button" disabled={photos.length >= maxPhotos} onClick={() => photoInput.current?.click()} className={styles.uploadBox}>
          <ImagePlus className={styles.uploadIcon} />
          <b className={styles.uploadTitle}>{t('add.photoUpload')}</b>
          <small className={styles.uploadHint}>{t('add.photoHint')}</small>
        </button>
      </div>
    </section>
  )
}
