import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import firebaseLib from '../../functions/lib/firebase.js'
import updateListingPriceModule from '../../functions/listings/updateListingPrice.js'
import { callableRequest, createAuthUser, expectHttpsError } from './helpers.js'

const { db } = firebaseLib
const { updateListingPrice } = updateListingPriceModule

async function createListing(overrides = {}) {
  const listingId = `listing-${randomUUID()}`
  const ownerId = `owner-${randomUUID()}`
  await db.collection('listings').doc(listingId).set({
    make: 'Toyota',
    model: 'Camry',
    status: 'published',
    publicPrice: 17000,
    ownerId,
    ...overrides,
  })
  return { listingId, ownerId }
}

describe('updateListingPrice', () => {
  it('rejects an unauthenticated caller', async () => {
    await expectHttpsError(
      updateListingPrice.run(callableRequest(null, { listingId: 'x', publicPrice: 18000 })),
      'unauthenticated',
    )
  })

  it('rejects a non-admin caller', async () => {
    const caller = await createAuthUser({ admin: false })
    await expectHttpsError(
      updateListingPrice.run(callableRequest(caller, { listingId: 'x', publicPrice: 18000 })),
      'permission-denied',
    )
  })

  it('rejects an invalid public price', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createListing()

    await expectHttpsError(
      updateListingPrice.run(callableRequest(admin, { listingId, publicPrice: -5 })),
      'invalid-argument',
    )
    await expectHttpsError(
      updateListingPrice.run(callableRequest(admin, { listingId })),
      'invalid-argument',
    )
  })

  it('fails when the listing does not exist', async () => {
    const admin = await createAuthUser({ admin: true })

    await expectHttpsError(
      updateListingPrice.run(callableRequest(admin, { listingId: `missing-${randomUUID()}`, publicPrice: 18000 })),
      'not-found',
    )
  })

  it('fails when the listing is not published', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId } = await createListing({ status: 'pending' })

    await expectHttpsError(
      updateListingPrice.run(callableRequest(admin, { listingId, publicPrice: 18000 })),
      'failed-precondition',
    )
  })

  it('updates the public price and records a moderation event', async () => {
    const admin = await createAuthUser({ admin: true })
    const { listingId, ownerId } = await createListing()

    const result = await updateListingPrice.run(callableRequest(admin, { listingId, publicPrice: 18000 }))
    expect(result).toEqual({ listingId, publicPrice: 18000 })

    const listingSnapshot = await db.collection('listings').doc(listingId).get()
    expect(listingSnapshot.data().publicPrice).toBe(18000)

    const events = await db.collection('listingModerationEvents').where('listingId', '==', listingId).get()
    expect(events.size).toBe(1)
    expect(events.docs[0].data()).toMatchObject({
      listingId,
      ownerId,
      fromStatus: 'published',
      toStatus: 'published',
      previousPublicPrice: 17000,
      publicPrice: 18000,
      adminId: admin.uid,
    })
  })
})
