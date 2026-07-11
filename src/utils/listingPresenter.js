import { carPlaceholderImage } from '../data/assets'
import { normalizeVehicleOptionValue, vehicleOptionLabel } from '../data/listingForm'

export const presentListingCard = (item, t) => ({
  ...item,
  price: Number(item.price) || 0,
  mileageRaw: Number(item.mileage) || 0,
  fuelValue: normalizeVehicleOptionValue('fuel', item.fuel),
  transmissionValue: normalizeVehicleOptionValue('transmission', item.transmission),
  transportStatusValue: normalizeVehicleOptionValue('transportStatus', item.transportStatus),
  title: `${item.make} ${item.model}`,
  image: item.image || carPlaceholderImage,
  market: item.market || Math.round(Number(item.price || 0) * 1.22),
  mileage: `${Number(item.mileage || 0).toLocaleString()} ${t('listing.km')}`,
  fuel: vehicleOptionLabel('fuel', item.fuel, t),
  transmission: vehicleOptionLabel('transmission', item.transmission, t),
  transportStatus: vehicleOptionLabel('transportStatus', item.transportStatus, t),
  eta: item.arrivalDate || t('listing.pendingDate'),
  location: t('listing.defaultLocation'),
  saving: t('home.inTransit'),
  sellerDisplayName: item.sellerType === 'company'
    ? item.companyName || item.sellerName || t('common.company')
    : item.sellerName || t('common.individual'),
  sellerTypeLabel: item.sellerType === 'company' ? t('common.company') : t('common.individual'),
  isVerifiedCompany: item.sellerType === 'company' && item.companyVerificationStatus === 'verified',
})

export const presentListingDetail = (listing, t) => {
  const price = Number(listing.price) || 0
  const market = Number(listing.market) || Math.round(price * 1.22)
  const saving = market > price ? `−${Math.round(((market - price) / market) * 100)}%` : t('home.inTransit')
  const phone = typeof listing.phone === 'string' ? listing.phone.trim() : ''
  const phoneDigits = phone.replace(/\D/g, '')
  const normalizedPhoneDigits = /^5\d{8}$/.test(phoneDigits) ? `995${phoneDigits}` : phoneDigits
  const images = [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(image => typeof image === 'string' && image.trim()))]

  if (!images.length) images.push(carPlaceholderImage)

  const sellerTypeLabel = listing.sellerType === 'company' ? t('common.company') : t('common.individual')

  return {
    ...listing,
    title: listing.title || `${listing.make || ''} ${listing.model || ''}`.trim(),
    price,
    market,
    mileage: typeof listing.mileage === 'number'
      ? `${listing.mileage.toLocaleString()} ${t('listing.km')}`
      : listing.mileage,
    fuel: vehicleOptionLabel('fuel', listing.fuel, t),
    transmission: vehicleOptionLabel('transmission', listing.transmission, t),
    transportStatus: vehicleOptionLabel('transportStatus', listing.transportStatus, t),
    eta: listing.eta || listing.arrivalDate || t('listing.pendingDate'),
    image: images[0],
    images,
    location: listing.location || t('listing.defaultLocation'),
    saving,
    sellerDisplayName: listing.sellerType === 'company'
      ? listing.companyName || listing.sellerName || sellerTypeLabel
      : listing.sellerName || sellerTypeLabel,
    isVerifiedCompany: listing.sellerType === 'company' && listing.companyVerificationStatus === 'verified',
    phone,
    phoneHref: phone ? `tel:${phone}` : '',
    whatsappHref: normalizedPhoneDigits ? `https://wa.me/${normalizedPhoneDigits}` : '',
  }
}
