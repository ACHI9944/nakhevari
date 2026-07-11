import {
  normalizeMileageUnit,
  normalizePriceCurrency,
} from './listingFilterUnits'

export const listingFilterDefaults = {
  q: '',
  make: '',
  model: '',
  minPrice: '',
  maxPrice: '',
  priceCurrency: 'usd',
  minYear: '',
  maxYear: '',
  minMileage: '',
  maxMileage: '',
  mileageUnit: 'km',
  fuel: '',
  transmission: '',
  transportStatus: '',
  sellerType: '',
  sort: 'newest',
}

const rangePairs = {
  minPrice: ['minPrice', 'maxPrice', 'priceCurrency'],
  maxPrice: ['minPrice', 'maxPrice', 'priceCurrency'],
  minYear: ['minYear', 'maxYear'],
  maxYear: ['minYear', 'maxYear'],
  minMileage: ['minMileage', 'maxMileage', 'mileageUnit'],
  maxMileage: ['minMileage', 'maxMileage', 'mileageUnit'],
}

const numberOrEmpty = value => Number.isFinite(Number(value)) && value !== '' ? String(value) : ''

export function listingFiltersFromSearchParams(params = new URLSearchParams()) {
  return {
    ...listingFilterDefaults,
    q: params.get('q') || '',
    make: params.get('make') || '',
    model: params.get('model') || '',
    minPrice: numberOrEmpty(params.get('minPrice') || ''),
    maxPrice: numberOrEmpty(params.get('maxPrice') || ''),
    priceCurrency: normalizePriceCurrency(params.get('priceCurrency')),
    minYear: numberOrEmpty(params.get('minYear') || ''),
    maxYear: numberOrEmpty(params.get('maxYear') || ''),
    minMileage: numberOrEmpty(params.get('minMileage') || ''),
    maxMileage: numberOrEmpty(params.get('maxMileage') || ''),
    mileageUnit: normalizeMileageUnit(params.get('mileageUnit')),
    fuel: params.get('fuel') || '',
    transmission: params.get('transmission') || '',
    transportStatus: params.get('transportStatus') || '',
    sellerType: params.get('sellerType') || '',
    sort: params.get('sort') || 'newest',
  }
}

export function listingFiltersToSearchParams(filters = {}) {
  const values = { ...listingFilterDefaults, ...filters }
  const params = new URLSearchParams()

  Object.entries(values).forEach(([key, value]) => {
    if (key === 'priceCurrency' && value === 'usd') return
    if (key === 'priceCurrency' && !values.minPrice && !values.maxPrice) return
    if (key === 'mileageUnit' && value === 'km') return
    if (key === 'mileageUnit' && !values.minMileage && !values.maxMileage) return
    if (key === 'sort' && value === 'newest') return
    if (value) params.set(key, value)
  })

  return params
}

export function removeListingFilterParam(params, name) {
  const nextParams = new URLSearchParams(params)
  const fields = rangePairs[name] || [name]
  fields.forEach(field => nextParams.delete(field))
  if (name === 'make') nextParams.delete('model')
  return nextParams
}
