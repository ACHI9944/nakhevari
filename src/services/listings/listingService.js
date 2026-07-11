import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../config/firebase'
import {
  buildListingSearchFields,
  normalizeListingSearchText,
  normalizeVinSearchText,
} from '../../utils/listingSearch'
import { mapListing } from './listingMapper'

const listingsRef = collection(db, 'listings')
const listingCursorCache = new Map()
const fallbackCursorCache = new Map()
const defaultListingsPageSize = 24
const fallbackListingsLimit = 250
const filterFields = ['make', 'model', 'fuel', 'transmission', 'transportStatus', 'sellerType']
const searchFields = [
  ['vinSearch', normalizeVinSearchText],
  ['makeModelSearch', normalizeListingSearchText],
  ['sellerSearch', normalizeListingSearchText],
]

const photoExtension = file => file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
const cleanString = value => typeof value === 'string' ? value.trim() : ''
const cleanNumber = value => {
  if (value === '' || value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const normalizeListingQuery = options => ({
  q: normalizeListingSearchText(options?.filters?.q || options?.q),
  filters: filterFields.reduce((result, field) => {
    const value = cleanString(options?.filters?.[field])
    if (value) result[field] = value
    return result
  }, {
    minPrice: cleanNumber(options?.filters?.minPrice),
    maxPrice: cleanNumber(options?.filters?.maxPrice),
    minYear: cleanNumber(options?.filters?.minYear),
    maxYear: cleanNumber(options?.filters?.maxYear),
    minMileage: cleanNumber(options?.filters?.minMileage),
    maxMileage: cleanNumber(options?.filters?.maxMileage),
  }),
  sort: ['priceAsc', 'priceDesc', 'yearDesc', 'mileageAsc'].includes(options?.sort) ? options.sort : 'newest',
  pageSize: Number.isFinite(Number(options?.pageSize)) ? Number(options.pageSize) : defaultListingsPageSize,
})

const listingQueryKey = request => JSON.stringify(request)

const sortConstraints = sort => {
  if (sort === 'priceAsc') return [orderBy('price', 'asc'), orderBy('createdAt', 'desc')]
  if (sort === 'priceDesc') return [orderBy('price', 'desc'), orderBy('createdAt', 'desc')]
  if (sort === 'yearDesc') return [orderBy('year', 'desc'), orderBy('createdAt', 'desc')]
  if (sort === 'mileageAsc') return [orderBy('mileage', 'asc'), orderBy('createdAt', 'desc')]
  return [orderBy('createdAt', 'desc')]
}

const inRange = (value, min, max) => {
  const number = Number(value)
  return (!Number.isFinite(min) || number >= min)
    && (!Number.isFinite(max) || number <= max)
}

const matchesRangeFilters = (listing, filters) => (
  inRange(listing.price, filters.minPrice, filters.maxPrice)
  && inRange(listing.year, filters.minYear, filters.maxYear)
  && inRange(listing.mileage, filters.minMileage, filters.maxMileage)
)

const normalizeMatchValue = value => String(value || '').trim().toLowerCase()

const matchesExactFilters = (listing, filters) => (
  filterFields.every(field => (
    !filters[field]
    || normalizeMatchValue(listing[field]) === normalizeMatchValue(filters[field])
  ))
)

const matchesTextSearch = (listing, term) => {
  if (!term) return true
  const vinTerm = normalizeVinSearchText(term)
  const textTerm = normalizeListingSearchText(term)
  const searchFields = buildListingSearchFields(listing)

  return Boolean(
    vinTerm && searchFields.vinSearch.startsWith(vinTerm)
    || textTerm && searchFields.makeModelSearch.startsWith(textTerm)
    || textTerm && searchFields.sellerSearch.startsWith(textTerm),
  )
}

const sortPublishedListings = (items, sort) => [...items].sort((a, b) => {
  if (sort === 'priceAsc') return Number(a.price) - Number(b.price)
  if (sort === 'priceDesc') return Number(b.price) - Number(a.price)
  if (sort === 'yearDesc') return Number(b.year) - Number(a.year)
  if (sort === 'mileageAsc') return Number(a.mileage) - Number(b.mileage)
  return (b.createdAt || 0) - (a.createdAt || 0)
})

const isMissingIndexError = error => (
  error?.code === 'failed-precondition'
  && typeof error.message === 'string'
  && error.message.toLowerCase().includes('index')
)

async function getPublishedListingsFallback(request, options = {}) {
  const snapshot = await getDocs(query(
    listingsRef,
    where('status', '==', 'published'),
    limit(fallbackListingsLimit),
  ))
  const offset = options.cursorToken ? fallbackCursorCache.get(options.cursorToken) || 0 : 0
  const filteredItems = sortPublishedListings(
    snapshot.docs
      .map(mapListing)
      .filter(listing => matchesTextSearch(listing, request.q))
      .filter(listing => matchesExactFilters(listing, request.filters))
      .filter(listing => matchesRangeFilters(listing, request.filters)),
    request.sort,
  )
  const items = filteredItems.slice(offset, offset + request.pageSize)
  const nextOffset = offset + items.length
  const hasMore = nextOffset < filteredItems.length
  const cursorToken = hasMore ? `fallback:${listingQueryKey(request)}:${nextOffset}:${Date.now()}` : null
  if (cursorToken) fallbackCursorCache.set(cursorToken, nextOffset)

  return {
    items,
    cursorToken,
    hasMore,
    fetchedAt: Date.now(),
  }
}

async function getPublishedListingsSearch(request, options = {}) {
  const [fallbackSnapshot, ...searchSnapshots] = await Promise.all([
    getDocs(query(
      listingsRef,
      where('status', '==', 'published'),
      limit(fallbackListingsLimit),
    )),
    ...searchFields.map(([field, normalize]) => {
      const term = normalize(request.q)
      if (!term) return Promise.resolve({ docs: [] })
      return getDocs(query(
        listingsRef,
        where('status', '==', 'published'),
        where(field, '>=', term),
        where(field, '<=', `${term}\uf8ff`),
        orderBy(field, 'asc'),
        limit(fallbackListingsLimit),
      ))
    }),
  ])
  const offset = options.cursorToken ? fallbackCursorCache.get(options.cursorToken) || 0 : 0
  const uniqueListings = new Map()
  const snapshotsToMerge = [...searchSnapshots, fallbackSnapshot]

  snapshotsToMerge.forEach(snapshot => {
    snapshot.docs.forEach(document => {
      if (!uniqueListings.has(document.id)) uniqueListings.set(document.id, mapListing(document))
    })
  })

  const filteredItems = sortPublishedListings(
    [...uniqueListings.values()]
      .filter(listing => matchesTextSearch(listing, request.q))
      .filter(listing => matchesExactFilters(listing, request.filters))
      .filter(listing => matchesRangeFilters(listing, request.filters)),
    request.sort,
  )
  const items = filteredItems.slice(offset, offset + request.pageSize)
  const nextOffset = offset + items.length
  const hasMore = nextOffset < filteredItems.length
  const cursorToken = hasMore ? `search:${listingQueryKey(request)}:${nextOffset}:${Date.now()}` : null
  if (cursorToken) fallbackCursorCache.set(cursorToken, nextOffset)

  return {
    items,
    cursorToken,
    hasMore,
    fetchedAt: Date.now(),
  }
}

export async function createListing(data, user, photos = [], profile = null) {
  const reference = doc(listingsRef)
  const uploadedPhotos = []
  const isVerifiedCompany = profile?.accountType === 'company'
    && profile.companyVerificationStatus === 'verified'

  try {
    const uploads = await Promise.allSettled(photos.map(async (file, index) => {
      const photoRef = ref(storage, `listing-images/${user.uid}/${reference.id}/${index}-${crypto.randomUUID()}.${photoExtension(file)}`)
      await uploadBytes(photoRef, file, { contentType: file.type })
      uploadedPhotos[index] = {
        url: await getDownloadURL(photoRef),
        path: photoRef.fullPath,
      }
    }))
    const failedUpload = uploads.find(result => result.status === 'rejected')
    if (failedUpload) throw failedUpload.reason

    const payload = {
      ...data,
      year: Number(data.year),
      price: Number(data.price),
      mileage: Number(data.mileage),
      companyName: isVerifiedCompany ? profile.companyName || '' : '',
      companyVerificationStatus: isVerifiedCompany ? 'verified' : 'not_required',
      ownerId: user.uid,
      ownerEmail: user.email || '',
      status: 'pending',
      schemaVersion: 1,
      image: uploadedPhotos[0].url,
      images: uploadedPhotos.map(photo => photo.url),
      imagePath: uploadedPhotos[0].path,
      imagePaths: uploadedPhotos.map(photo => photo.path),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    Object.assign(payload, buildListingSearchFields(payload))
    await setDoc(reference, payload)
    return reference.id
  } catch (error) {
    await Promise.allSettled(uploadedPhotos.map(photo => deleteObject(ref(storage, photo.path))))
    throw error
  }
}

export async function getMyListings(userId) {
  const snapshot = await getDocs(query(listingsRef, where('ownerId', '==', userId)))
  return snapshot.docs.map(mapListing).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getPublishedListings(options = {}) {
  const request = normalizeListingQuery(options)
  if (request.q) {
    try {
      return await getPublishedListingsSearch(request, options)
    } catch (error) {
      if (!isMissingIndexError(error) && error?.code !== 'failed-precondition') throw error
    }
    return getPublishedListingsFallback(request, options)
  }

  const key = listingQueryKey(request)
  const constraints = [
    where('status', '==', 'published'),
    ...filterFields
      .filter(field => request.filters[field])
      .map(field => where(field, '==', request.filters[field])),
    ...sortConstraints(request.sort),
  ]
  const items = []
  let cursor = options.cursorToken ? listingCursorCache.get(options.cursorToken) : null
  let lastScanned = null
  let hasMore = false
  let scans = 0

  try {
    while (items.length < request.pageSize && scans < 5) {
      const snapshot = await getDocs(query(
        listingsRef,
        ...constraints,
        ...(cursor ? [startAfter(cursor)] : []),
        limit(request.pageSize),
      ))
      scans += 1
      if (snapshot.empty) {
        hasMore = false
        break
      }

      lastScanned = snapshot.docs[snapshot.docs.length - 1]
      snapshot.docs
        .map(mapListing)
        .filter(listing => matchesRangeFilters(listing, request.filters))
        .forEach(listing => {
          if (items.length < request.pageSize) items.push(listing)
        })

      hasMore = snapshot.docs.length === request.pageSize
      cursor = lastScanned
      if (!hasMore) break
    }
  } catch (error) {
    if (isMissingIndexError(error) || error?.code === 'failed-precondition') return getPublishedListingsFallback(request, options)
    throw error
  }

  if (!options.cursorToken && items.length === 0) {
    return getPublishedListingsFallback(request, options)
  }

  const cursorToken = hasMore && lastScanned ? `${key}:${lastScanned.id}:${Date.now()}` : null
  if (cursorToken) listingCursorCache.set(cursorToken, lastScanned)

  return {
    items,
    cursorToken,
    hasMore,
    fetchedAt: Date.now(),
  }
}

export async function getAdminListings(status = 'pending') {
  const listingsQuery = status === 'all'
    ? query(listingsRef)
    : query(listingsRef, where('status', '==', status))
  const snapshot = await getDocs(listingsQuery)
  return snapshot.docs.map(mapListing).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getListingById(listingId) {
  const snapshot = await getDoc(doc(db, 'listings', listingId))
  if (!snapshot.exists()) return null
  const listing = mapListing(snapshot)
  return listing.status === 'published' ? listing : null
}

export async function removeListing(listingId) {
  const snapshot = await getDoc(doc(db, 'listings', listingId))
  if (snapshot.exists()) {
    const listingPhotosRef = ref(storage, `listing-images/${snapshot.data().ownerId}/${listingId}`)
    const photos = await listAll(listingPhotosRef)
    await Promise.all(photos.items.map(deleteObject))
  }
  await deleteDoc(doc(db, 'listings', listingId))
}
