import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import setUserStatusModule from '../../functions/users/setUserStatus.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { setUserStatus } = setUserStatusModule

async function createProfile(uid, overrides = {}) {
  await db.collection('users').doc(uid).set({
    email: `${uid}@example.com`,
    profileStatus: 'active',
    ...overrides,
  })
}

async function latestUserStatusEvent(uid) {
  const snapshot = await db.collection('userStatusEvents').where('uid', '==', uid).get()
  expect(snapshot.size).toBe(1)
  return snapshot.docs[0].data()
}

describe('setUserStatus', () => {
  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    const target = await createAuthUser()
    await createProfile(target.uid)

    await expectHttpsError(
      setUserStatus.run(callableRequest(caller, { uid: target.uid, status: 'suspended', reason: 'Fraud report' })),
      'permission-denied',
    )
  })

  it('rejects a missing user or invalid status', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: '', status: 'suspended', reason: 'reason' })),
      'invalid-argument',
    )
    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: 'someone', status: 'archived', reason: 'reason' })),
      'invalid-argument',
    )
  })

  it('requires a reason when suspending', async () => {
    const admin = await createAuthUser({ admin: true })
    const target = await createAuthUser()
    await createProfile(target.uid)

    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: target.uid, status: 'suspended' })),
      'invalid-argument',
    )
  })

  it('rejects an admin changing their own status', async () => {
    const admin = await createAuthUser({ admin: true })
    await createProfile(admin.uid)

    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: admin.uid, status: 'suspended', reason: 'reason' })),
      'failed-precondition',
    )
  })

  it('rejects suspending a user who currently holds admin access', async () => {
    const admin = await createAuthUser({ admin: true })
    const otherAdmin = await createAuthUser({ admin: true })
    await createProfile(otherAdmin.uid)

    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: otherAdmin.uid, status: 'suspended', reason: 'reason' })),
      'failed-precondition',
    )
  })

  it('fails when the user profile does not exist', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      setUserStatus.run(callableRequest(admin, { uid: `missing-${randomUUID()}`, status: 'suspended', reason: 'reason' })),
      'not-found',
    )
  })

  it('suspends a user and records an event', async () => {
    const admin = await createAuthUser({ admin: true })
    const target = await createAuthUser()
    await createProfile(target.uid)

    const result = await setUserStatus.run(callableRequest(admin, {
      uid: target.uid,
      status: 'suspended',
      reason: 'Repeated policy violations',
    }))
    expect(result).toEqual({ uid: target.uid, status: 'suspended', reason: 'Repeated policy violations' })

    const profile = await db.collection('users').doc(target.uid).get()
    expect(profile.data().profileStatus).toBe('suspended')
    expect(profile.data().profileStatusReason).toBe('Repeated policy violations')

    const event = await latestUserStatusEvent(target.uid)
    expect(event).toMatchObject({
      uid: target.uid,
      fromStatus: 'active',
      toStatus: 'suspended',
      adminId: admin.uid,
    })
  })

  it('reactivates a suspended user without requiring a reason', async () => {
    const admin = await createAuthUser({ admin: true })
    const target = await createAuthUser()
    await createProfile(target.uid, { profileStatus: 'suspended', profileStatusReason: 'Old reason' })

    const result = await setUserStatus.run(callableRequest(admin, { uid: target.uid, status: 'active' }))
    expect(result).toEqual({ uid: target.uid, status: 'active', reason: '' })

    const profile = await db.collection('users').doc(target.uid).get()
    expect(profile.data().profileStatus).toBe('active')
    expect(profile.data().profileStatusReason).toBe('')
  })
})
