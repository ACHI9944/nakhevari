const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

exports.updateListingPrice = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const listingId = typeof request.data?.listingId === 'string' ? request.data.listingId.trim() : ''
  const publicPrice = Number(request.data?.publicPrice)

  if (!listingId) throw new HttpsError('invalid-argument', 'A valid listing is required.')
  if (!(Number.isFinite(publicPrice) && publicPrice > 0)) {
    throw new HttpsError('invalid-argument', 'A valid public price is required.')
  }

  const listingRef = db.collection('listings').doc(listingId)
  const eventRef = db.collection('listingModerationEvents').doc()

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(listingRef)
    if (!snapshot.exists) throw new HttpsError('not-found', 'Listing not found.')

    const listing = snapshot.data()
    if (listing.status !== 'published') {
      throw new HttpsError('failed-precondition', 'Only published listings can have their price updated.')
    }

    transaction.update(listingRef, {
      publicPrice,
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.create(eventRef, {
      listingId,
      ownerId: listing.ownerId,
      fromStatus: 'published',
      toStatus: 'published',
      reason: '',
      previousPublicPrice: listing.publicPrice,
      publicPrice,
      adminId: request.auth.uid,
      adminEmail: request.auth.token.email || '',
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return { listingId, publicPrice }
}))
