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
  it('derives search fields for a listing', () => {
    expect(buildListingSearchFields({
      make: 'Toyota',
      model: 'Prius',
      vin: 'JTD-KB20U-123456',
    })).toEqual({
      vinSearch: 'jtdkb20u123456',
      makeModelSearch: 'toyota prius',
    })
  })

  it('is resilient to a missing listing argument', () => {
    expect(buildListingSearchFields()).toEqual({
      vinSearch: '',
      makeModelSearch: '',
    })
  })
})
