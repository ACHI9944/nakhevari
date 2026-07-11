const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const allowedCompanyStatuses = new Set(['pending', 'verified', 'rejected'])

exports.updateCompanyVerification = onCall({ region: REGION }, wrapCallable(async request => {
  const actor = await assertAdmin(request)
  const uid = typeof request.data?.uid === 'string' ? request.data.uid.trim() : ''
  const status = request.data?.status
  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : ''

  if (!uid || !allowedCompanyStatuses.has(status) || status === 'pending') {
    throw new HttpsError('invalid-argument', 'A valid company and verification status are required.')
  }
  if (status === 'rejected' && !reason) {
    throw new HttpsError('invalid-argument', 'A rejection reason is required.')
  }
  if (reason.length > 500) throw new HttpsError('invalid-argument', 'The verification reason is too long.')

  const userRef = db.collection('users').doc(uid)
  const eventRef = db.collection('companyVerificationEvents').doc()

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists) throw new HttpsError('not-found', 'User profile not found.')

    const profile = snapshot.data()
    if (profile.accountType !== 'company') {
      throw new HttpsError('failed-precondition', 'Only company profiles can be verified.')
    }

    const fromStatus = profile.companyVerificationStatus || 'pending'
    transaction.update(userRef, {
      companyVerificationStatus: status,
      companyVerificationReason: status === 'rejected' ? reason : '',
      companyVerifiedBy: status === 'verified' ? request.auth.uid : '',
      companyVerifiedAt: status === 'verified' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.create(eventRef, {
      uid,
      email: profile.email || '',
      companyName: profile.companyName || '',
      fromStatus,
      toStatus: status,
      reason: status === 'rejected' ? reason : '',
      adminId: request.auth.uid,
      adminEmail: actor.email || request.auth.token.email || '',
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return { uid, status, reason: status === 'rejected' ? reason : '' }
}))
