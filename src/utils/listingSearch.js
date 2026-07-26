const whitespacePattern = /\s+/g
const vinPunctuationPattern = /[^a-z0-9]/g

export const normalizeListingSearchText = value => (
  String(value || '')
    .trim()
    .toLocaleLowerCase()
    .replace(whitespacePattern, ' ')
)

export const normalizeVinSearchText = value => (
  normalizeListingSearchText(value).replace(vinPunctuationPattern, '')
)

export function buildListingSearchFields(listing = {}) {
  return {
    vinSearch: normalizeVinSearchText(listing.vin),
    makeModelSearch: normalizeListingSearchText([listing.make, listing.model].filter(Boolean).join(' ')),
  }
}
