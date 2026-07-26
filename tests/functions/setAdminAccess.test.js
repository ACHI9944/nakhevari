import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import setAdminAccessModule from '../../functions/admins/setAdminAccess.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { auth, db } = firebaseLib
const { setAdminAccess } = setAdminAccessModule

async function latestAdminAccessEvent(targetUid) {
  const snapshot = await db.collection('adminAccessEvents').where('targetUid', '==', targetUid).get()
  expect(snapshot.size).toBe(1)
  return snapshot.docs[0].data()
}

describe('setAdminAccess', () => {
  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    const target = await createAuthUser()

    await expectHttpsError(
      setAdminAccess.run(callableRequest(caller, { email: target.email, enabled: true })),
      'permission-denied',
    )
  })

  it('rejects a missing email or non-boolean enabled value', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      setAdminAccess.run(callableRequest(admin, { email: '', enabled: true })),
      'invalid-argument',
    )
    await expectHttpsError(
      setAdminAccess.run(callableRequest(admin, { email: 'someone@example.com', enabled: 'yes' })),
      'invalid-argument',
    )
  })

  it('rejects an email with no matching user', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      setAdminAccess.run(callableRequest(admin, { email: 'no-such-user@example.com', enabled: true })),
      'not-found',
    )
  })

  it('rejects an admin trying to remove their own access', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      setAdminAccess.run(callableRequest(admin, { email: admin.email, enabled: false })),
      'failed-precondition',
    )
  })

  it('grants admin access and records an applied audit event', async () => {
    const admin = await createAuthUser({ admin: true })
    const target = await createAuthUser({ admin: false })

    const result = await setAdminAccess.run(callableRequest(admin, { email: target.email, enabled: true }))
    expect(result).toMatchObject({ uid: target.uid, enabled: true })

    const updatedUser = await auth.getUser(target.uid)
    expect(updatedUser.customClaims?.admin).toBe(true)

    const event = await latestAdminAccessEvent(target.uid)
    expect(event).toMatchObject({
      targetUid: target.uid,
      enabled: true,
      actorUid: admin.uid,
      status: 'applied',
    })
  })

  it('revokes admin access and records an applied audit event', async () => {
    const admin = await createAuthUser({ admin: true })
    const target = await createAuthUser({ admin: true })

    const result = await setAdminAccess.run(callableRequest(admin, { email: target.email, enabled: false }))
    expect(result).toMatchObject({ uid: target.uid, enabled: false })

    const updatedUser = await auth.getUser(target.uid)
    expect(updatedUser.customClaims?.admin).toBeUndefined()

    const event = await latestAdminAccessEvent(target.uid)
    expect(event.status).toBe('applied')
    expect(event.enabled).toBe(false)
  })
})
