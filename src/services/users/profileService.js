import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function getProfiles(limit = 100) {
  const callable = httpsCallable(functions, 'listProfiles')
  const result = await callable({ limit })
  return Array.isArray(result.data?.users) ? result.data.users : []
}

export async function setUserStatus({ uid, status, reason = '' }) {
  const callable = httpsCallable(functions, 'setUserStatus')
  const result = await callable({ uid, status, reason })
  return result.data
}
