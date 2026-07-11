import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function updateCompanyVerification({ uid, status, reason = '' }) {
  const callable = httpsCallable(functions, 'updateCompanyVerification')
  const result = await callable({ uid, status, reason })
  return result.data
}
