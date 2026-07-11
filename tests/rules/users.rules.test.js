import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const uid = 'company-user-1'
const email = 'nino@example.com'

const baseProfile = {
  name: 'Nino Company',
  email,
  emailVerified: true,
  phone: '+995500000000',
  phoneVerified: false,
  accountType: 'company',
  companyName: 'Nino LLC',
  identificationNumber: '123456789',
  companyVerificationStatus: 'pending',
  profileStatus: 'active',
  role: 'user',
  profileCompleted: true,
  createdAt: new Date('2026-01-01'),
}

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'nakhevari-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users', uid), baseProfile)
  })
})

describe('users/{userId} update rule', () => {
  it('lets the owner keep editing their profile after a Cloud Function writes verification metadata (regression for the profile-lockout bug)', async () => {
    // Mirrors functions/companies/updateCompanyVerification.js, which writes these
    // three fields via the Admin SDK (bypasses rules) whenever an admin reviews a
    // company account.
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', uid), {
        companyVerificationStatus: 'verified',
        companyVerificationReason: '',
        companyVerifiedBy: 'admin-uid',
        companyVerifiedAt: new Date('2026-02-01'),
      }, { merge: true })
    })

    const owner = testEnv.authenticatedContext(uid, { email, email_verified: true })
    const userRef = doc(owner.firestore(), 'users', uid)

    await assertSucceeds(setDoc(userRef, {
      ...baseProfile,
      companyVerificationStatus: 'verified',
      phone: '+995511111111',
      updatedAt: new Date('2026-02-02'),
    }, { merge: true }))

    let snapshot
    await testEnv.withSecurityRulesDisabled(async context => {
      snapshot = await getDoc(doc(context.firestore(), 'users', uid))
    })
    expect(snapshot.data().phone).toBe('+995511111111')
    // Admin-written fields must survive the owner's unrelated update untouched.
    expect(snapshot.data().companyVerifiedBy).toBe('admin-uid')
  })

  it('still rejects a client trying to change their own role', async () => {
    const owner = testEnv.authenticatedContext(uid, { email, email_verified: true })
    const userRef = doc(owner.firestore(), 'users', uid)

    await assertFails(setDoc(userRef, { ...baseProfile, role: 'admin' }, { merge: true }))
  })

  it('still rejects writes that touch a field outside the allowed update set', async () => {
    const owner = testEnv.authenticatedContext(uid, { email, email_verified: true })
    const userRef = doc(owner.firestore(), 'users', uid)

    await assertFails(setDoc(userRef, { ...baseProfile, notAnAllowedField: 'x' }, { merge: true }))
  })
})
