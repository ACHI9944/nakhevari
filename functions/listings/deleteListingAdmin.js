const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, storage, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

exports.deleteListingAdmin = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const listingId = typeof request.data?.listingId === 'string' ? request.data.listingId.trim() : ''
  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : ''

  if (!listingId) throw new HttpsError('invalid-argument', 'A valid listing is required.')
  if (!reason) throw new HttpsError('invalid-argument', 'A deletion reason is required.')
  if (reason.length > 500) throw new HttpsError('invalid-argument', 'The deletion reason is too long.')

  const listingRef = db.collection('listings').doc(listingId)
  const sellerInfoRef = listingRef.collection('private').doc('sellerInfo')
  const eventRef = db.collection('listingModerationEvents').doc()

  const listing = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(listingRef)
    if (!snapshot.exists) throw new HttpsError('not-found', 'Listing not found.')

    const data = snapshot.data()
    transaction.delete(listingRef)
    transaction.delete(sellerInfoRef)
    transaction.create(eventRef, {
      listingId,
      ownerId: data.ownerId,
      fromStatus: data.status,
      toStatus: 'deleted',
      reason,
      adminId: request.auth.uid,
      adminEmail: request.auth.token.email || '',
      createdAt: FieldValue.serverTimestamp(),
    })
    return data
  })

  try {
    await storage.bucket().deleteFiles({ prefix: `listing-images/${listing.ownerId}/${listingId}/` })
  } catch (error) {
    console.error('deleteListingAdmin: failed to delete listing images', error)
  }

  return { listingId }
}))
