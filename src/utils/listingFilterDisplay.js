import { formGroups, localizeVehicleOptions } from '../data/listingForm'
import { mileageUnitLabel, priceCurrencySymbol } from './listingFilterUnits'

const technicalFields = formGroups[1][1]
const optionsFor = name => technicalFields.find(field => field.name === name).options

export function buildVehicleOptionGroups(t) {
  return {
    fuelOptions: localizeVehicleOptions(optionsFor('fuel'), t),
    transmissionOptions: localizeVehicleOptions(optionsFor('transmission'), t),
    transportOptions: localizeVehicleOptions(optionsFor('transportStatus'), t),
  }
}

export function buildListingFilterLabels(filters, t) {
  const priceSymbol = priceCurrencySymbol(filters.priceCurrency)
  const currentMileageUnit = mileageUnitLabel(filters.mileageUnit, t)

  const yearLabel = filters.minYear || filters.maxYear
    ? `${filters.minYear || t('listings.minYear')} - ${filters.maxYear || t('listings.maxYear')}`
    : t('filters.year')
  const priceLabel = filters.minPrice || filters.maxPrice
    ? `${priceSymbol}${filters.minPrice || 0} - ${filters.maxPrice ? `${priceSymbol}${filters.maxPrice}` : t('listings.maxPrice')}`
    : t('filters.price')
  const mileageLabel = filters.minMileage || filters.maxMileage
    ? `${filters.minMileage || 0} - ${filters.maxMileage || t('listings.maxMileage')} ${currentMileageUnit}`
    : t('listing.mileage')

  return { priceSymbol, currentMileageUnit, yearLabel, priceLabel, mileageLabel }
}
