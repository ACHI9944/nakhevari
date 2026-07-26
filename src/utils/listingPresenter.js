import { carPlaceholderImage } from '../data/assets'
import { platformContact } from '../config/platformContact'
import { normalizeVehicleOptionValue, vehicleOptionLabel } from '../data/listingForm'

export const presentListingCard = (item, t) => ({
  ...item,
  price: Number(item.publicPrice) || 0,
  mileageRaw: Number(item.mileage) || 0,
  fuelValue: normalizeVehicleOptionValue('fuel', item.fuel),
  transmissionValue: normalizeVehicleOptionValue('transmission', item.transmission),
  transportStatusValue: normalizeVehicleOptionValue('transportStatus', item.transportStatus),
  title: `${item.make} ${item.model}`,
  image: item.image || carPlaceholderImage,
  market: item.market || Math.round(Number(item.publicPrice || 0) * 1.22),
  mileage: `${Number(item.mileage || 0).toLocaleString()} ${t('listing.km')}`,
  fuel: vehicleOptionLabel('fuel', item.fuel, t),
  transmission: vehicleOptionLabel('transmission', item.transmission, t),
  transportStatus: vehicleOptionLabel('transportStatus', item.transportStatus, t),
  eta: item.arrivalDate || t('listing.pendingDate'),
  location: t('listing.defaultLocation'),
  saving: t('home.inTransit'),
  sellerDisplayName: platformContact.name,
})

export const presentListingDetail = (listing, t) => {
  const price = Number(listing.publicPrice) || 0
  const market = Number(listing.market) || Math.round(price * 1.22)
  const saving = market > price ? `−${Math.round(((market - price) / market) * 100)}%` : t('home.inTransit')
  const images = [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(image => typeof image === 'string' && image.trim()))]

  if (!images.length) images.push(carPlaceholderImage)

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
    sellerDisplayName: platformContact.name,
    phone: platformContact.phone,
    phoneHref: platformContact.phoneHref,
    whatsappHref: platformContact.whatsappHref,
  }
}
