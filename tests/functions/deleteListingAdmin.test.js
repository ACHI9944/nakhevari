import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import deleteListingAdminModule from '../../functions/listings/deleteListingAdmin.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { deleteListingAdmin } = deleteListingAdminModule

async function createListing(overrides = {}) {
  const listingId = `listing-${randomUUID()}`
  const ownerId = `owner-${randomUUID()}`
  await db.collection('listings').doc(listingId).set({
    make: 'Toyota',
    model: 'Camry',
    status: 'published',
    ownerId,
    ...overrides,
  })
  await db.collection('listings').doc(listingId).collection('private').doc('sellerInfo').set({
    ownerId,
    sellerName: 'Owner One',
    phone: '+995500000001',
    sellerPrice: 15000,
    ownerEmail: 'owner@example.com',
  })
  return { listingId, ownerId }
}

describe('deleteListingAdmin', () => {
  it('rejects an unauthenticated caller', async () => {
    await expectHttpsError(
      deleteListingAdmin.run(callableRequest(null, { listingId: 'x', reason: 'duplicate' })),
      'unauthenticated',
    )
  })

  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    await expectHttpsError(
      deleteListingAdmin.run(callableRequest(caller, { listingId: 'x', reason: 'duplicate' })),
      'permission-denied',
    )
  })

  it('requires a deletion reason', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createListing()

    await expectHttpsError(
      deleteListingAdmin.run(callableRequest(admin, { listingId })),
      'invalid-argument',
    )
  })

  it('fails when the listing does not exist', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      deleteListingAdmin.run(callableRequest(admin, { listingId: `missing-${randomUUID()}`, reason: 'duplicate' })),
      'not-found',
    )
  })

  it('deletes the listing and its seller info, and records a moderation event', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId, ownerId } = await createListing({ status: 'sold' })

    const result = await deleteListingAdmin.run(callableRequest(admin, { listingId, reason: 'Duplicate listing' }))
    expect(result).toEqual({ listingId })

    const listingSnapshot = await db.collection('listings').doc(listingId).get()
    expect(listingSnapshot.exists).toBe(false)

    const sellerInfoSnapshot = await db.collection('listings').doc(listingId).collection('private').doc('sellerInfo').get()
    expect(sellerInfoSnapshot.exists).toBe(false)

    const events = await db.collection('listingModerationEvents').where('listingId', '==', listingId).get()
    expect(events.size).toBe(1)
    expect(events.docs[0].data()).toMatchObject({
      listingId,
      ownerId,
      fromStatus: 'sold',
      toStatus: 'deleted',
      reason: 'Duplicate listing',
      adminId: admin.uid,
    })
  })
})
