import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function moderateListing({ listingId, status, reason = '' }) {
  const callable = httpsCallable(functions, 'moderateListing')
  const result = await callable({ listingId, status, reason })
  return result.data
}
