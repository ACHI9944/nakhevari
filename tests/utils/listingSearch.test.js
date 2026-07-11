import { describe, expect, it } from 'vitest'
import {
  buildListingSearchFields,
  normalizeListingSearchText,
  normalizeVinSearchText,
} from '../../src/utils/listingSearch'

describe('normalizeListingSearchText', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeListingSearchText('  Toyota   Prius  ')).toBe('toyota prius')
  })

  it('keeps Georgian letters', () => {
    expect(normalizeListingSearchText('  ტოიოტა   პრიუსი  ')).toBe('ტოიოტა პრიუსი')
  })

  it('handles null/undefined/number input without throwing', () => {
    expect(normalizeListingSearchText(null)).toBe('')
    expect(normalizeListingSearchText(undefined)).toBe('')
    expect(normalizeListingSearchText(2024)).toBe('2024')
  })
})

describe('normalizeVinSearchText', () => {
  it('strips punctuation and lowercases', () => {
    expect(normalizeVinSearchText('  1HG-CM826 33A004352  ')).toBe('1hgcm82633a004352')
  })
})

describe('buildListingSearchFields', () => {
  it('derives search fields for an individual seller', () => {
    expect(buildListingSearchFields({
      make: 'Toyota',
      model: 'Prius',
      vin: 'JTD-KB20U-123456',
      sellerType: 'individual',
      sellerName: 'Nino Imports',
    })).toEqual({
      vinSearch: 'jtdkb20u123456',
      makeModelSearch: 'toyota prius',
      sellerSearch: 'nino imports',
    })
  })

  it('prefers companyName over sellerName for company listings', () => {
    expect(buildListingSearchFields({
      make: 'Ford',
      model: 'Fusion',
      vin: '3FA6P0HD0ER123456',
      sellerType: 'company',
      sellerName: 'Fallback Seller',
      companyName: 'Verified Cars GE',
    }).sellerSearch).toBe('verified cars ge')
  })

  it('falls back to sellerName when a company has no companyName set', () => {
    expect(buildListingSearchFields({
      sellerType: 'company',
      sellerName: 'Fallback Seller',
    }).sellerSearch).toBe('fallback seller')
  })

  it('is resilient to a missing listing argument', () => {
    expect(buildListingSearchFields()).toEqual({
      vinSearch: '',
      makeModelSearch: '',
      sellerSearch: '',
    })
  })
})
