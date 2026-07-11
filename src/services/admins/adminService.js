import { httpsCallable } from 'firebase/functions'
import { functions } from '../../config/firebase'

export async function getAdmins() {
  const callable = httpsCallable(functions, 'listAdmins')
  const result = await callable()
  return result.data.admins
}

export async function setAdminAccess({ email, enabled }) {
  const callable = httpsCallable(functions, 'setAdminAccess')
  const result = await callable({ email, enabled })
  return result.data
}
