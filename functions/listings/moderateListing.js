const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const allowedActions = new Set(['published', 'rejected'])

exports.moderateListing = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const listingId = typeof request.data?.listingId === 'string' ? request.data.listingId.trim() : ''
  const status = request.data?.status
  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : ''

  if (!listingId || !allowedActions.has(status)) {
    throw new HttpsError('invalid-argument', 'A valid listing and moderation status are required.')
  }
  if (status === 'rejected' && !reason) {
    throw new HttpsError('invalid-argument', 'A rejection reason is required.')
  }
  if (reason.length > 500) throw new HttpsError('invalid-argument', 'The moderation reason is too long.')

  const listingRef = db.collection('listings').doc(listingId)
  const eventRef = db.collection('listingModerationEvents').doc()

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(listingRef)
    if (!snapshot.exists) throw new HttpsError('not-found', 'Listing not found.')

    const listing = snapshot.data()
    if (listing.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending listings can be moderated.')
    }

    const moderation = {
      status,
      rejectionReason: status === 'rejected' ? reason : '',
      reviewedBy: request.auth.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    transaction.update(listingRef, moderation)
    transaction.create(eventRef, {
      listingId,
      ownerId: listing.ownerId,
      fromStatus: listing.status,
      toStatus: status,
      reason: moderation.rejectionReason,
      adminId: request.auth.uid,
      adminEmail: request.auth.token.email || '',
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return { listingId, status }
}))
