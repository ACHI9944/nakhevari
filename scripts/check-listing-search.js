import assert from 'node:assert/strict'
import {
  buildListingSearchFields,
  normalizeListingSearchText,
  normalizeVinSearchText,
} from '../src/utils/listingSearch.js'

assert.equal(normalizeListingSearchText('  Toyota   Prius  '), 'toyota prius')
assert.equal(normalizeListingSearchText('  ტოიოტა   პრიუსი  '), 'ტოიოტა პრიუსი')
assert.equal(normalizeVinSearchText('  1HG-CM826 33A004352  '), '1hgcm82633a004352')

assert.deepEqual(buildListingSearchFields({
  make: 'Toyota',
  model: 'Prius',
  vin: 'JTD-KB20U-123456',
  sellerType: 'individual',
  sellerName: 'Nino Imports',
}), {
  vinSearch: 'jtdkb20u123456',
  makeModelSearch: 'toyota prius',
  sellerSearch: 'nino imports',
})

assert.deepEqual(buildListingSearchFields({
  make: 'Ford',
  model: 'Fusion',
  vin: '3FA6P0HD0ER123456',
  sellerType: 'company',
  sellerName: 'Fallback Seller',
  companyName: 'Verified Cars GE',
}), {
  vinSearch: '3fa6p0hd0er123456',
  makeModelSearch: 'ford fusion',
  sellerSearch: 'verified cars ge',
})

console.log('listing search checks passed')
