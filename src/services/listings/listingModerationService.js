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
