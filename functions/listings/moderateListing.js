const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const transitionsByStatus = {
  pending: new Set(['published', 'rejected']),
  published: new Set(['unpublished', 'sold']),
  unpublished: new Set(['published', 'sold']),
}
const allowedActions = new Set(Object.values(transitionsByStatus).flatMap(set => [...set]))

exports.moderateListing = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const listingId = typeof request.data?.listingId === 'string' ? request.data.listingId.trim() : ''
  const status = request.data?.status
  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : ''
  const publicPrice = Number(request.data?.publicPrice)

  if (!listingId || !allowedActions.has(status)) {
    throw new HttpsError('invalid-argument', 'A valid listing and moderation status are required.')
  }
  if (status === 'rejected' && !reason) {
    throw new HttpsError('invalid-argument', 'A rejection reason is required.')
  }
  if (reason.length > 500) throw new HttpsError('invalid-argument', 'The moderation reason is too long.')
  if (status === 'published' && !(Number.isFinite(publicPrice) && publicPrice > 0)) {
    throw new HttpsError('invalid-argument', 'A valid public price is required to publish a listing.')
  }

  const listingRef = db.collection('listings').doc(listingId)
  const sellerInfoRef = listingRef.collection('private').doc('sellerInfo')
  const eventRef = db.collection('listingModerationEvents').doc()

  await db.runTransaction(async transaction => {
    const [snapshot, sellerInfoSnapshot] = await Promise.all([
      transaction.get(listingRef),
      transaction.get(sellerInfoRef),
    ])
    if (!snapshot.exists) throw new HttpsError('not-found', 'Listing not found.')

    const listing = snapshot.data()
    if (!transitionsByStatus[listing.status]?.has(status)) {
      throw new HttpsError('failed-precondition', 'This listing cannot be moderated into that status.')
    }

    const moderation = {
      status,
      rejectionReason: status === 'rejected' ? reason : '',
      reviewedBy: request.auth.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(status === 'published' ? { publicPrice } : {}),
    }
    const sellerPrice = sellerInfoSnapshot.exists ? sellerInfoSnapshot.data().sellerPrice : undefined

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
      ...(status === 'published' ? { publicPrice } : {}),
      ...(sellerPrice !== undefined ? { sellerPrice } : {}),
    })
  })

  return { listingId, status }
}))
