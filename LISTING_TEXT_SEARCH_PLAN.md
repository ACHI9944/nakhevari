# Listing Text Search Plan

## Goal
Support simple text search on published listings for:

- VIN
- make and model text
- seller name
- verified company name

Firestore does not provide full-text search, so this should be implemented as normalized prefix search fields rather than ad hoc client-side scanning.

## Proposed Schema
Add derived, lowercased fields to each listing document:

- `vinSearch`: normalized VIN, for exact or prefix VIN lookup.
- `makeModelSearch`: normalized make/model phrase, for prefix make/model lookup.
- `sellerSearch`: normalized seller or company display name, for prefix seller lookup.

The source of truth remains the existing fields: `vin`, `make`, `model`, `sellerName`, `companyName`. Search fields are derived fields only.

## Normalization
Use the shared helper in `src/utils/listingSearch.js` for client and any future backfill/admin tooling:

- trim leading/trailing whitespace
- lowercase
- collapse repeated whitespace
- keep Georgian and Latin letters
- strip punctuation from VIN-like queries

## Query Strategy
For a non-empty search term:

1. Normalize the search term.
2. Decide which field to query:
   - VIN-like input: `vinSearch`
   - otherwise: start with `makeModelSearch`
   - seller/company search can be a second query merged client-side, or a later dedicated mode.
3. Use Firestore prefix range:
   - `where(field, '>=', term)`
   - `where(field, '<=', term + '\uf8ff')`
4. Always keep `where('status', '==', 'published')`.
5. Preserve existing filter/sort behavior where indexes support it; otherwise keep the existing missing-index fallback.

## Firestore Rules
Because listing documents are client-created, `firestore.rules` must be updated together with the schema:

- allow the three derived fields in `create` and pending `update`
- validate each field is a string with a bounded length
- validate each derived field matches the normalized value of the corresponding source fields if rules can express it safely

If exact normalization cannot be safely expressed in Firestore rules, prefer moving listing creation through a Cloud Function before trusting search fields for ranking or filtering.

## Indexes
Current text-search composite indexes:

- `status ASC, vinSearch ASC`
- `status ASC, makeModelSearch ASC`
- `status ASC, sellerSearch ASC`

Search candidates are merged and sorted client-side after fetching. Additional combinations with price/year/mileage sorts should be added only after confirming the final query shapes, otherwise the index set will grow quickly.

## Backfill
Existing listings need a one-time backfill before text search is complete:

1. Deploy rules and indexes.
2. Open the deployed Admin panel and use the "Update search indexes" maintenance card:
   `https://nakhevari-ge.web.app/admin`
3. Click "Check" for a dry run.
4. Click "Update" until the result says no further batch remains.

Local Admin SDK alternative:

1. Run a dry-run backfill from `functions/`:
   `npm run backfill:listing-search`
2. If the output looks correct, apply the updates:
   `npm run backfill:listing-search -- --write`
3. For a smaller trial run, pass a max document limit:
   `npm run backfill:listing-search -- --limit=100 --write`
4. Repeat until the dry run reports `0` changed listings.

## Rollout
Recommended order:

1. Add derived fields to new listing writes plus Firestore rules. Done.
2. Add Listings/Home `q` URL param and search input. Done.
3. Wire service query logic with fallback for missing indexes. Done.
4. Add indexes. Done in `firestore.indexes.json`; deploy still pending.
5. Add checks around `src/utils/listingSearch.js`. Done with `npm run check:listing-search`.
6. Backfill existing listings with `functions/scripts/backfill-listing-search-fields.js`.
7. Deploy indexes before relying on indexed text search in production.
8. Run manual regression for empty query, filters, load more, and search combinations.
