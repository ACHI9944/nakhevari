import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function backfillListingSearchFields({ cursor = '', dryRun = true, limit = 400, status = 'published' } = {}) {
  const callable = httpsCallable(functions, 'backfillListingSearchFields')
  const result = await callable({ cursor, dryRun, limit, status })
  return result.data
}
