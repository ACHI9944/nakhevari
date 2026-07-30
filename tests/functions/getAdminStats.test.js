import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import getAdminStatsModule from '../../functions/admins/getAdminStats.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { getAdminStats } = getAdminStatsModule

describe('getAdminStats', () => {
  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })

    await expectHttpsError(getAdminStats.run(callableRequest(caller, {})), 'permission-denied')
  })

  it('reflects newly created listings, users, and companies in the aggregate counts', async () => {
    const admin = await createAuthUser({ admin: true })
    const before = await getAdminStats.run(callableRequest(admin, {}))

    await db.collection('listings').doc(`listing-${randomUUID()}`).set({ status: 'pending' })
    await db.collection('listings').doc(`listing-${randomUUID()}`).set({ status: 'published' })
    await db.collection('users').doc(`uid-${randomUUID()}`).set({ profileStatus: 'suspended' })
    await db.collection('users').doc(`uid-${randomUUID()}`).set({ profileStatus: 'active' })
    await db.collection('users').doc(`uid-${randomUUID()}`).set({
      accountType: 'company',
      companyVerificationStatus: 'verified',
    })

    const after = await getAdminStats.run(callableRequest(admin, {}))

    // Other test files in this suite run concurrently against the same emulator
    // project and also create listings/users, so counts can only be asserted as
    // "increased by at least what this test added," not as exact totals.
    expect(after.listings.pending).toBeGreaterThanOrEqual(before.listings.pending + 1)
    expect(after.listings.published).toBeGreaterThanOrEqual(before.listings.published + 1)
    expect(after.listings.all).toBeGreaterThanOrEqual(before.listings.all + 2)
    expect(after.users.suspended).toBeGreaterThanOrEqual(before.users.suspended + 1)
    expect(after.users.all).toBeGreaterThanOrEqual(before.users.all + 3)
    expect(after.users.active).toBe(after.users.all - after.users.suspended)
    expect(after.companies.verified).toBeGreaterThanOrEqual(before.companies.verified + 1)
    expect(after.companies.all).toBeGreaterThanOrEqual(before.companies.all + 1)
  })
})
