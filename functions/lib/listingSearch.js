const whitespacePattern = /\s+/g
const vinPunctuationPattern = /[^a-z0-9]/g

const normalizeListingSearchText = value => (
  String(value || '')
    .trim()
    .toLocaleLowerCase()
    .replace(whitespacePattern, ' ')
)

const normalizeVinSearchText = value => (
  normalizeListingSearchText(value).replace(vinPunctuationPattern, '')
)

function buildListingSearchFields(listing = {}) {
  return {
    vinSearch: normalizeVinSearchText(listing.vin),
    makeModelSearch: normalizeListingSearchText([listing.make, listing.model].filter(Boolean).join(' ')),
  }
}

module.exports = {
  buildListingSearchFields,
  normalizeListingSearchText,
  normalizeVinSearchText,
}
