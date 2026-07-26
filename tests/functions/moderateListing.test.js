import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import moderateListingModule from '../../functions/listings/moderateListing.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { moderateListing } = moderateListingModule

async function createPendingListing(overrides = {}) {
  const listingId = `listing-${randomUUID()}`
  const ownerId = `owner-${randomUUID()}`
  await db.collection('listings').doc(listingId).set({
    make: 'Toyota',
    model: 'Camry',
    status: 'pending',
    ownerId,
    ...overrides,
  })
  return { listingId, ownerId }
}

describe('moderateListing', () => {
  it('rejects an unauthenticated caller', async () => {
    await expectHttpsError(
      moderateListing.run(callableRequest(null, { listingId: 'x', status: 'published' })),
      'unauthenticated',
    )
  })

  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    await expectHttpsError(
      moderateListing.run(callableRequest(caller, { listingId: 'x', status: 'published' })),
      'permission-denied',
    )
  })

  it('rejects an invalid status', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createPendingListing()

    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId, status: 'archived' })),
      'invalid-argument',
    )
  })

  it('requires a reason when rejecting', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createPendingListing()

    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId, status: 'rejected' })),
      'invalid-argument',
    )
  })

  it('requires a valid public price when publishing', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createPendingListing()

    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId, status: 'published' })),
      'invalid-argument',
    )
    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId, status: 'published', publicPrice: -5 })),
      'invalid-argument',
    )
  })

  it('fails when the listing does not exist', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId: `missing-${randomUUID()}`, status: 'published', publicPrice: 17000 })),
      'not-found',
    )
  })

  it('fails when the listing is not pending', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createPendingListing({ status: 'published' })

    await expectHttpsError(
      moderateListing.run(callableRequest(admin, { listingId, status: 'published', publicPrice: 17000 })),
      'failed-precondition',
    )
  })

  it('publishes a pending listing with the admin-set public price and records a moderation event', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId, ownerId } = await createPendingListing()
    await db.collection('listings').doc(listingId).collection('private').doc('sellerInfo').set({
      ownerId,
      sellerName: 'Owner One',
      phone: '+995500000001',
      sellerPrice: 15000,
      ownerEmail: 'owner@example.com',
    })

    const result = await moderateListing.run(callableRequest(admin, { listingId, status: 'published', publicPrice: 17000 }))
    expect(result).toEqual({ listingId, status: 'published' })

    const listingSnapshot = await db.collection('listings').doc(listingId).get()
    expect(listingSnapshot.data().status).toBe('published')
    expect(listingSnapshot.data().reviewedBy).toBe(admin.uid)
    expect(listingSnapshot.data().publicPrice).toBe(17000)

    const events = await db.collection('listingModerationEvents').where('listingId', '==', listingId).get()
    expect(events.size).toBe(1)
    const event = events.docs[0].data()
    expect(event).toMatchObject({
      listingId,
      ownerId,
      fromStatus: 'pending',
      toStatus: 'published',
      adminId: admin.uid,
      publicPrice: 17000,
      sellerPrice: 15000,
    })
  })

  it('rejects a pending listing with a reason and records it', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createPendingListing()

    const result = await moderateListing.run(callableRequest(admin, {
      listingId,
      status: 'rejected',
      reason: 'Missing VIN photo',
    }))
    expect(result).toEqual({ listingId, status: 'rejected' })

    const listingSnapshot = await db.collection('listings').doc(listingId).get()
    expect(listingSnapshot.data().status).toBe('rejected')
    expect(listingSnapshot.data().rejectionReason).toBe('Missing VIN photo')

    const events = await db.collection('listingModerationEvents').where('listingId', '==', listingId).get()
    expect(events.docs[0].data().reason).toBe('Missing VIN photo')
  })
})
