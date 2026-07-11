import { describe, expect, it } from 'vitest'
import {
  listingFilterDefaults,
  listingFiltersFromSearchParams,
  listingFiltersToSearchParams,
  removeListingFilterParam,
} from '../../src/utils/listingFilterParams'

describe('listingFiltersFromSearchParams', () => {
  it('returns defaults for an empty query', () => {
    expect(listingFiltersFromSearchParams()).toEqual(listingFilterDefaults)
  })

  it('reads known params and normalizes currency/unit', () => {
    const params = new URLSearchParams('make=Toyota&minPrice=5000&priceCurrency=gel&mileageUnit=mi')
    const filters = listingFiltersFromSearchParams(params)
    expect(filters.make).toBe('Toyota')
    expect(filters.minPrice).toBe('5000')
    expect(filters.priceCurrency).toBe('gel')
    expect(filters.mileageUnit).toBe('mi')
  })

  it('drops non-numeric range values', () => {
    const params = new URLSearchParams('minPrice=not-a-number')
    expect(listingFiltersFromSearchParams(params).minPrice).toBe('')
  })
})

describe('listingFiltersToSearchParams', () => {
  it('omits default values from the query string', () => {
    const params = listingFiltersToSearchParams({ ...listingFilterDefaults, make: 'BMW' })
    expect(params.toString()).toBe('make=BMW')
  })

  it('only keeps priceCurrency/mileageUnit when a matching range value is set', () => {
    const withoutRange = listingFiltersToSearchParams({ ...listingFilterDefaults, priceCurrency: 'gel' })
    expect(withoutRange.has('priceCurrency')).toBe(false)

    const withRange = listingFiltersToSearchParams({ ...listingFilterDefaults, priceCurrency: 'gel', minPrice: '100' })
    expect(withRange.get('priceCurrency')).toBe('gel')
  })

  it('round-trips through fromSearchParams', () => {
    const original = { ...listingFilterDefaults, make: 'Toyota', minYear: '2018', sort: 'priceAsc' }
    const roundTripped = listingFiltersFromSearchParams(listingFiltersToSearchParams(original))
    expect(roundTripped).toEqual(original)
  })
})

describe('removeListingFilterParam', () => {
  it('removes both sides of a range pair together', () => {
    const params = new URLSearchParams('minPrice=100&maxPrice=200&priceCurrency=gel&make=BMW')
    const next = removeListingFilterParam(params, 'minPrice')
    expect(next.has('minPrice')).toBe(false)
    expect(next.has('maxPrice')).toBe(false)
    expect(next.has('priceCurrency')).toBe(false)
    expect(next.get('make')).toBe('BMW')
  })

  it('also clears model when make is removed', () => {
    const params = new URLSearchParams('make=BMW&model=X5')
    const next = removeListingFilterParam(params, 'make')
    expect(next.has('make')).toBe(false)
    expect(next.has('model')).toBe(false)
  })
})
