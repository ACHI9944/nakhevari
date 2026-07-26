import { randomUUID } from 'node:crypto'
import firebaseLib from '../../functions/lib/firebase.js'

const { auth } = firebaseLib

export async function createAuthUser({ admin = false, emailVerified = true } = {}) {
  const uid = `uid-${randomUUID()}`
  const email = `${uid}@example.com`
  await auth.createUser({ uid, email, emailVerified })
  if (admin) await auth.setCustomUserClaims(uid, { admin: true })
  return { uid, email }
}

export function callableRequest(user, data) {
  return {
    auth: user ? { uid: user.uid, token: { email: user.email, email_verified: true } } : undefined,
    data,
  }
}

export async function expectHttpsError(promise, code) {
  try {
    await promise
  } catch (error) {
    if (error.code !== code) {
      throw new Error(`Expected HttpsError code "${code}" but got "${error.code}": ${error.message}`)
    }
    return error
  }
  throw new Error(`Expected an HttpsError with code "${code}" but the call succeeded.`)
}
