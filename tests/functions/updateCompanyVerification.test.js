import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import updateCompanyVerificationModule from '../../functions/companies/updateCompanyVerification.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { updateCompanyVerification } = updateCompanyVerificationModule

async function createCompanyProfile(overrides = {}) {
  const uid = `company-${randomUUID()}`
  await db.collection('users').doc(uid).set({
    accountType: 'company',
    companyName: 'Acme LLC',
    companyVerificationStatus: 'pending',
    email: `${uid}@example.com`,
    ...overrides,
  })
  return uid
}

async function latestCompanyEvent(uid) {
  const snapshot = await db.collection('companyVerificationEvents').where('uid', '==', uid).get()
  expect(snapshot.size).toBe(1)
  return snapshot.docs[0].data()
}

describe('updateCompanyVerification', () => {
  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    const uid = await createCompanyProfile()

    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(caller, { uid, status: 'verified' })),
      'permission-denied',
    )
  })

  it('rejects an unknown or "pending" status', async () => {
    const admin = await createAuthUser({ admin: true })
    const uid = await createCompanyProfile()

    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(admin, { uid, status: 'archived' })),
      'invalid-argument',
    )
    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(admin, { uid, status: 'pending' })),
      'invalid-argument',
    )
  })

  it('requires a reason when rejecting', async () => {
    const admin = await createAuthUser({ admin: true })
    const uid = await createCompanyProfile()

    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(admin, { uid, status: 'rejected' })),
      'invalid-argument',
    )
  })

  it('fails when the user profile does not exist', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(admin, { uid: `missing-${randomUUID()}`, status: 'verified' })),
      'not-found',
    )
  })

  it('fails when the profile is not a company account', async () => {
    const admin = await createAuthUser({ admin: true })
    const uid = await createCompanyProfile({ accountType: 'individual' })

    await expectHttpsError(
      updateCompanyVerification.run(callableRequest(admin, { uid, status: 'verified' })),
      'failed-precondition',
    )
  })

  it('verifies a company profile and records an event', async () => {
    const admin = await createAuthUser({ admin: true })
    const uid = await createCompanyProfile()

    const result = await updateCompanyVerification.run(callableRequest(admin, { uid, status: 'verified' }))
    expect(result).toEqual({ uid, status: 'verified', reason: '' })

    const profile = await db.collection('users').doc(uid).get()
    expect(profile.data().companyVerificationStatus).toBe('verified')
    expect(profile.data().companyVerifiedBy).toBe(admin.uid)

    const event = await latestCompanyEvent(uid)
    expect(event).toMatchObject({ uid, fromStatus: 'pending', toStatus: 'verified', adminId: admin.uid })
  })

  it('rejects a company profile with a reason and records it', async () => {
    const admin = await createAuthUser({ admin: true })
    const uid = await createCompanyProfile()

    const result = await updateCompanyVerification.run(callableRequest(admin, {
      uid,
      status: 'rejected',
      reason: 'Identification number does not match registry',
    }))
    expect(result).toEqual({ uid, status: 'rejected', reason: 'Identification number does not match registry' })

    const profile = await db.collection('users').doc(uid).get()
    expect(profile.data().companyVerificationStatus).toBe('rejected')
    expect(profile.data().companyVerifiedBy).toBe('')

    const event = await latestCompanyEvent(uid)
    expect(event.reason).toBe('Identification number does not match registry')
  })
})
