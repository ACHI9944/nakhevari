import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function moderateListing({ listingId, status, reason = '', publicPrice }) {
  const callable = httpsCallable(functions, 'moderateListing')
  const result = await callable({
    listingId,
    status,
    reason,
    ...(status === 'published' ? { publicPrice: Number(publicPrice) } : {}),
  })
  return result.data
}

export async function updateListingPrice({ listingId, publicPrice }) {
  const callable = httpsCallable(functions, 'updateListingPrice')
  const result = await callable({ listingId, publicPrice: Number(publicPrice) })
  return result.data
}

export async function deleteListingAdmin({ listingId, reason }) {
  const callable = httpsCallable(functions, 'deleteListingAdmin')
  const result = await callable({ listingId, reason })
  return result.data
}
