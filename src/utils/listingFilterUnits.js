export const fallbackGelPerUsd = 2.7
const kmPerMile = 1.609344

export const priceCurrencyOptions = [
  { value: 'usd', labelKey: 'listings.units.usd' },
  { value: 'gel', labelKey: 'listings.units.gel' },
]

export const mileageUnitOptions = [
  { value: 'km', labelKey: 'listings.units.km' },
  { value: 'mi', labelKey: 'listings.units.mi' },
]

export const normalizePriceCurrency = value => (
  value === 'gel' ? 'gel' : 'usd'
)

export const normalizeMileageUnit = value => (
  value === 'mi' ? 'mi' : 'km'
)

export const priceCurrencySymbol = currency => (
  normalizePriceCurrency(currency) === 'gel' ? '₾' : '$'
)

export const mileageUnitLabel = (unit, t) => (
  t(normalizeMileageUnit(unit) === 'mi' ? 'listings.units.mi' : 'listings.units.km')
)

const convertOptionalNumber = (value, convert) => {
  if (value === '' || value == null) return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return String(Math.round(convert(number) * 100) / 100)
}

export function toBaseListingFilters(filters, { gelPerUsd = fallbackGelPerUsd } = {}) {
  const priceCurrency = normalizePriceCurrency(filters.priceCurrency)
  const mileageUnit = normalizeMileageUnit(filters.mileageUnit)
  const safeGelPerUsd = Number.isFinite(Number(gelPerUsd)) && Number(gelPerUsd) > 0
    ? Number(gelPerUsd)
    : fallbackGelPerUsd
  return {
    ...filters,
    minPrice: convertOptionalNumber(filters.minPrice, value => (
      priceCurrency === 'gel' ? value / safeGelPerUsd : value
    )),
    maxPrice: convertOptionalNumber(filters.maxPrice, value => (
      priceCurrency === 'gel' ? value / safeGelPerUsd : value
    )),
    minMileage: convertOptionalNumber(filters.minMileage, value => (
      mileageUnit === 'mi' ? value * kmPerMile : value
    )),
    maxMileage: convertOptionalNumber(filters.maxMileage, value => (
      mileageUnit === 'mi' ? value * kmPerMile : value
    )),
    priceCurrency: undefined,
    mileageUnit: undefined,
  }
}
