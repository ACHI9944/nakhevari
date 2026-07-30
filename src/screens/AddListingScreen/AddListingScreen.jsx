import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button, Footer, Header } from '../../components'
import { useAuth } from '../../store/useAuth'
import { formGroups } from '../../data/listingForm'
import { createListing, getOwnListingById, updateListing } from '../../services/listings/listingService'
import { useVehicleCatalog } from '../../hooks/useVehicleCatalog'
import { ConditionSection, ContactSection, VehicleFormSections } from './components'
import { useListingPhotos } from './hooks/useListingPhotos'
import styles from './AddListingScreen.module.css'

export function AddListing() {
  const navigate = useNavigate()
  const { id: listingId } = useParams()
  const isEditing = Boolean(listingId)
  const { t } = useTranslation()
  const { profile, user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [makeId, setMakeId] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [selectValues, setSelectValues] = useState({})
  const [arrivalDate, setArrivalDate] = useState('')
  const [defaultValues, setDefaultValues] = useState({})
  const [originalImagePaths, setOriginalImagePaths] = useState([])
  const today = new Date()
  const firstArrivalDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const lastArrivalDate = new Date(today.getFullYear() + 3, 11, 31)
  const { makes, makesLoading } = useVehicleCatalog('')
  const resolvedMakeId = useMemo(() => {
    if (makeId) return makeId
    if (!isEditing || !vehicleMake || !makes.length) return ''
    return String(makes.find(make => make.name === vehicleMake)?.id || '')
  }, [isEditing, makeId, makes, vehicleMake])
  const { models, modelsLoading } = useVehicleCatalog(resolvedMakeId)
  const sellerType = profile?.accountType === 'company' && profile.companyVerificationStatus === 'verified'
    ? 'company'
    : profile?.accountType === 'individual'
      ? 'individual'
      : ''
  const { addPhotos, maxPhotos, photoInput, photos, removePhoto, setExistingPhotos } = useListingPhotos({
    onError: () => setError(t('add.photoError')),
    onValid: () => setError(''),
  })

  useEffect(() => {
    if (!isEditing) return
    let active = true
    getOwnListingById(listingId, user.uid)
      .then(listing => {
        if (!active) return
        if (!listing) {
          setLoadError(t('add.editNotFound'))
          return
        }
        setVehicleMake(listing.make)
        setVehicleModel(listing.model)
        setArrivalDate(listing.arrivalDate)
        setSelectValues({
          fuel: listing.fuel,
          transmission: listing.transmission,
          transportStatus: listing.transportStatus,
        })
        setDefaultValues({
          year: listing.year,
          price: listing.price,
          vin: listing.vin,
          mileage: listing.mileage,
          damageDescription: listing.damageDescription || '',
          sellerName: listing.sellerName || '',
          phone: listing.phone || '',
        })
        setExistingPhotos((listing.images || []).map((url, index) => ({ url, path: listing.imagePaths?.[index] })))
        setOriginalImagePaths(listing.imagePaths || [])
      })
      .catch(fetchError => {
        if (!active) return
        console.error('add-listing: failed to load listing for edit', fetchError)
        setLoadError(t('add.editLoadError'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, listingId, user.uid])

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const requiredSelects = formGroups.flatMap(([, fields]) => fields.filter(field => field.type === 'select').map(field => field.name))
    if (!sellerType) {
      setError(t('add.companyVerificationRequired'))
      return
    }
    if (!vehicleMake || !vehicleModel || !arrivalDate || requiredSelects.some(name => !form.get(name))) {
      setError(t('filters.requiredFields'))
      return
    }
    setSaving(true)
    setError('')
    try {
      if (!photos.length) {
        setError(t('add.photoRequired'))
        setSaving(false)
        return
      }
      if (isEditing) {
        const keepPhotos = photos.filter(photo => photo.existing).map(photo => ({ url: photo.url, path: photo.path }))
        const newPhotoFiles = photos.filter(photo => !photo.existing).map(photo => photo.file)
        const removedPaths = originalImagePaths.filter(path => !keepPhotos.some(photo => photo.path === path))
        await updateListing(
          listingId,
          Object.fromEntries(form.entries()),
          user,
          { keepPhotos, newPhotoFiles, removedPaths },
          profile,
        )
      } else {
        await createListing(
          Object.fromEntries(form.entries()),
          user,
          photos.map(photo => photo.file),
          profile,
        )
      }
      navigate('/account', { replace: true })
    } catch (error) {
      console.error('add-listing: failed to save listing', error)
      setError(t('add.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const changeMake = (value, option) => {
    setVehicleMake(value)
    setMakeId(option?.id ? String(option.id) : '')
    setVehicleModel('')
  }

  const changeSelect = (name, value) => {
    setSelectValues(current => ({ ...current, [name]: value }))
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <button
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            <ArrowLeft size={17} /> {t('add.back')}
          </button>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>{t('add.eyebrow')}</span>
            <h1 className={styles.title}>{isEditing ? t('add.editTitle') : t('add.title')}</h1>
            <p className={styles.description}>{isEditing ? t('add.editDescription') : t('add.description')}</p>
          </div>
          {loading ? (
            <div className={styles.form}>{t('common.loading')}</div>
          ) : loadError ? (
            <p className={styles.error}>{loadError}</p>
          ) : (
            <form onSubmit={submit} className={styles.form}>
              <VehicleFormSections
                arrivalDate={arrivalDate}
                defaultValues={defaultValues}
                firstArrivalDate={firstArrivalDate}
                lastArrivalDate={lastArrivalDate}
                makeId={resolvedMakeId}
                makes={makes}
                makesLoading={makesLoading}
                models={models}
                modelsLoading={modelsLoading}
                onArrivalDateChange={setArrivalDate}
                onMakeChange={changeMake}
                onModelChange={setVehicleModel}
                onSelectChange={changeSelect}
                selectValues={selectValues}
                t={t}
                vehicleMake={vehicleMake}
                vehicleModel={vehicleModel}
              />
              <ConditionSection
                addPhotos={addPhotos}
                defaultDamageDescription={defaultValues.damageDescription}
                maxPhotos={maxPhotos}
                photoInput={photoInput}
                photos={photos}
                removePhoto={removePhoto}
                t={t}
              />
              <ContactSection
                defaultPhone={defaultValues.phone}
                defaultSellerName={defaultValues.sellerName}
                sellerType={sellerType}
                t={t}
              />
              {error && <p className={styles.error}>{error}</p>}
              <Button type="submit" disabled={saving} className={styles.submit}>
                <Upload size={17} /> {saving ? t('add.saving') : isEditing ? t('add.editSubmit') : t('add.submit')}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
