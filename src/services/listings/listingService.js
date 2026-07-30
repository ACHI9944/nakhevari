import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
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
  if (sort === 'priceAsc') return [orderBy('publicPrice', 'asc'), orderBy('createdAt', 'desc')]
  if (sort === 'priceDesc') return [orderBy('publicPrice', 'desc'), orderBy('createdAt', 'desc')]
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
  inRange(listing.publicPrice, filters.minPrice, filters.maxPrice)
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
  if (sort === 'priceAsc') return Number(a.publicPrice) - Number(b.publicPrice)
  if (sort === 'priceDesc') return Number(b.publicPrice) - Number(a.publicPrice)
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
  const { price, sellerName, phone, ...publicFields } = data

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

    const publicPayload = {
      ...publicFields,
      year: Number(data.year),
      mileage: Number(data.mileage),
      ownerId: user.uid,
      status: 'pending',
      schemaVersion: 2,
      image: uploadedPhotos[0].url,
      images: uploadedPhotos.map(photo => photo.url),
      imagePath: uploadedPhotos[0].path,
      imagePaths: uploadedPhotos.map(photo => photo.path),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    Object.assign(publicPayload, buildListingSearchFields(publicPayload))

    // Seller-identifying data and the seller's own asking price stay off the
    // public doc entirely, in a subcollection only the owner/admins can read.
    const sellerInfoPayload = {
      ownerId: user.uid,
      sellerName,
      phone,
      sellerPrice: Number(price),
      ownerEmail: user.email || '',
      companyVerificationStatus: isVerifiedCompany ? 'verified' : 'not_required',
      ...(isVerifiedCompany ? { companyName: profile.companyName || '' } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const batch = writeBatch(db)
    batch.set(reference, publicPayload)
    batch.set(doc(reference, 'private', 'sellerInfo'), sellerInfoPayload)
    await batch.commit()
    return reference.id
  } catch (error) {
    await Promise.allSettled(uploadedPhotos.map(photo => deleteObject(ref(storage, photo.path))))
    throw error
  }
}

export async function updateListing(listingId, data, user, photoChanges = {}, profile = null) {
  const { keepPhotos = [], newPhotoFiles = [], removedPaths = [] } = photoChanges
  const reference = doc(db, 'listings', listingId)
  const uploadedPhotos = []
  const isVerifiedCompany = profile?.accountType === 'company'
    && profile.companyVerificationStatus === 'verified'
  const { price, sellerName, phone, ...publicFields } = data

  try {
    const uploads = await Promise.allSettled(newPhotoFiles.map(async (file, index) => {
      const photoRef = ref(storage, `listing-images/${user.uid}/${listingId}/${keepPhotos.length + index}-${crypto.randomUUID()}.${photoExtension(file)}`)
      await uploadBytes(photoRef, file, { contentType: file.type })
      uploadedPhotos[index] = {
        url: await getDownloadURL(photoRef),
        path: photoRef.fullPath,
      }
    }))
    const failedUpload = uploads.find(result => result.status === 'rejected')
    if (failedUpload) throw failedUpload.reason

    const allPhotos = [...keepPhotos, ...uploadedPhotos]

    const publicPayload = {
      ...publicFields,
      year: Number(data.year),
      mileage: Number(data.mileage),
      status: 'pending',
      image: allPhotos[0].url,
      images: allPhotos.map(photo => photo.url),
      imagePath: allPhotos[0].path,
      imagePaths: allPhotos.map(photo => photo.path),
      updatedAt: serverTimestamp(),
    }
    Object.assign(publicPayload, buildListingSearchFields(publicPayload))

    const sellerInfoPayload = {
      sellerName,
      phone,
      sellerPrice: Number(price),
      updatedAt: serverTimestamp(),
      ...(isVerifiedCompany ? { companyName: profile.companyName || '', companyVerificationStatus: 'verified' } : {}),
    }

    const batch = writeBatch(db)
    batch.update(reference, publicPayload)
    batch.update(doc(reference, 'private', 'sellerInfo'), sellerInfoPayload)
    await batch.commit()

    await Promise.allSettled(removedPaths.map(path => deleteObject(ref(storage, path))))
  } catch (error) {
    await Promise.allSettled(uploadedPhotos.map(photo => photo && deleteObject(ref(storage, photo.path))))
    throw error
  }
}

async function withSellerInfo(listings) {
  const snapshots = await Promise.all(
    listings.map(listing => getDoc(doc(db, 'listings', listing.id, 'private', 'sellerInfo'))),
  )
  return listings.map((listing, index) => {
    if (!snapshots[index].exists()) return listing
    const { ownerId: _ownerId, createdAt: _createdAt, updatedAt: _updatedAt, ...sellerInfo } = snapshots[index].data()
    return { ...listing, ...sellerInfo }
  })
}

export async function getMyListings(userId) {
  const snapshot = await getDocs(query(listingsRef, where('ownerId', '==', userId)))
  const listings = await withSellerInfo(snapshot.docs.map(mapListing))
  return listings
    .map(listing => ({ ...listing, price: listing.sellerPrice }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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

// The admin dashboard filters/searches/counts across every status entirely
// client-side (src/screens/AdminScreen/hooks/useAdminDashboardData.js), so it needs
// the full working set rather than a paginated slice. adminListingsFetchCap is a
// safety ceiling, not a page size: past this many listings the dashboard needs real
// server-side counts/pagination instead of a larger cap.
const adminListingsFetchCap = 2000

export async function getAdminListings(status = 'pending') {
  const listingsQuery = status === 'all'
    ? query(listingsRef, limit(adminListingsFetchCap))
    : query(listingsRef, where('status', '==', status), limit(adminListingsFetchCap))
  const snapshot = await getDocs(listingsQuery)
  const listings = await withSellerInfo(snapshot.docs.map(mapListing))
  return listings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getListingById(listingId) {
  const snapshot = await getDoc(doc(db, 'listings', listingId))
  if (!snapshot.exists()) return null
  const listing = mapListing(snapshot)
  return listing.status === 'published' ? listing : null
}

export async function getOwnListingById(listingId, uid) {
  const snapshot = await getDoc(doc(db, 'listings', listingId))
  if (!snapshot.exists()) return null
  const listing = mapListing(snapshot)
  if (listing.ownerId !== uid) return null
  const [withInfo] = await withSellerInfo([listing])
  return { ...withInfo, price: withInfo.sellerPrice }
}

export async function removeListing(listingId) {
  const snapshot = await getDoc(doc(db, 'listings', listingId))
  if (snapshot.exists()) {
    const listingPhotosRef = ref(storage, `listing-images/${snapshot.data().ownerId}/${listingId}`)
    const photos = await listAll(listingPhotosRef)
    await Promise.all(photos.items.map(deleteObject))
  }
  const batch = writeBatch(db)
  batch.delete(doc(db, 'listings', listingId))
  batch.delete(doc(db, 'listings', listingId, 'private', 'sellerInfo'))
  await batch.commit()
}
