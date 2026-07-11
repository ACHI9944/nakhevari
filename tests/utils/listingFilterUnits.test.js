import { describe, expect, it } from 'vitest'
import {
  fallbackGelPerUsd,
  mileageUnitLabel,
  normalizeMileageUnit,
  normalizePriceCurrency,
  priceCurrencySymbol,
  toBaseListingFilters,
} from '../../src/utils/listingFilterUnits'

describe('normalizePriceCurrency / normalizeMileageUnit', () => {
  it('only accepts the known currency/unit values', () => {
    expect(normalizePriceCurrency('gel')).toBe('gel')
    expect(normalizePriceCurrency('usd')).toBe('usd')
    expect(normalizePriceCurrency('eur')).toBe('usd')
    expect(normalizePriceCurrency(undefined)).toBe('usd')

    expect(normalizeMileageUnit('mi')).toBe('mi')
    expect(normalizeMileageUnit('km')).toBe('km')
    expect(normalizeMileageUnit('anything')).toBe('km')
  })
})

describe('priceCurrencySymbol', () => {
  it('maps currency to a symbol', () => {
    expect(priceCurrencySymbol('gel')).toBe('₾')
    expect(priceCurrencySymbol('usd')).toBe('$')
  })
})

describe('mileageUnitLabel', () => {
  const t = key => key

  it('translates the normalized unit', () => {
    expect(mileageUnitLabel('mi', t)).toBe('listings.units.mi')
    expect(mileageUnitLabel('km', t)).toBe('listings.units.km')
  })
})

describe('toBaseListingFilters', () => {
  it('leaves USD/km filters unchanged', () => {
    const result = toBaseListingFilters({
      minPrice: '10000',
      maxPrice: '20000',
      priceCurrency: 'usd',
      minMileage: '100',
      maxMileage: '200',
      mileageUnit: 'km',
    })
    expect(result.minPrice).toBe('10000')
    expect(result.maxPrice).toBe('20000')
    expect(result.minMileage).toBe('100')
    expect(result.maxMileage).toBe('200')
  })

  it('converts GEL prices to USD using the given rate', () => {
    const result = toBaseListingFilters(
      { minPrice: '27000', priceCurrency: 'gel' },
      { gelPerUsd: 2.7 },
    )
    expect(result.minPrice).toBe('10000')
  })

  it('falls back to fallbackGelPerUsd when the rate is missing or invalid', () => {
    const withMissingRate = toBaseListingFilters({ minPrice: '2.7', priceCurrency: 'gel' }, {})
    const withInvalidRate = toBaseListingFilters({ minPrice: '2.7', priceCurrency: 'gel' }, { gelPerUsd: 0 })
    expect(Number(withMissingRate.minPrice)).toBeCloseTo(2.7 / fallbackGelPerUsd, 5)
    expect(Number(withInvalidRate.minPrice)).toBeCloseTo(2.7 / fallbackGelPerUsd, 5)
  })

  it('converts miles to kilometers', () => {
    const result = toBaseListingFilters({ minMileage: '100', mileageUnit: 'mi' })
    expect(Number(result.minMileage)).toBeCloseTo(160.93, 1)
  })

  it('passes through empty range values as empty strings', () => {
    const result = toBaseListingFilters({ minPrice: '', maxPrice: undefined, priceCurrency: 'gel' })
    expect(result.minPrice).toBe('')
    expect(result.maxPrice).toBe('')
  })

  it('drops the currency/unit keys from the returned filters', () => {
    const result = toBaseListingFilters({ priceCurrency: 'gel', mileageUnit: 'mi' })
    expect(result.priceCurrency).toBeUndefined()
    expect(result.mileageUnit).toBeUndefined()
  })
})
