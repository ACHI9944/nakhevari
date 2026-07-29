const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { auth, db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const allowedStatuses = new Set(['active', 'suspended'])

exports.setUserStatus = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const uid = typeof request.data?.uid === 'string' ? request.data.uid.trim() : ''
  const status = request.data?.status
  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : ''

  if (!uid || !allowedStatuses.has(status)) {
    throw new HttpsError('invalid-argument', 'A valid user and status are required.')
  }
  if (status === 'suspended' && !reason) {
    throw new HttpsError('invalid-argument', 'A suspension reason is required.')
  }
  if (reason.length > 500) throw new HttpsError('invalid-argument', 'The status reason is too long.')
  if (uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot change your own account status.')
  }

  if (status === 'suspended') {
    let target
    try {
      target = await auth.getUser(uid)
    } catch (error) {
      if (error.code === 'auth/user-not-found') throw new HttpsError('not-found', 'User not found.')
      throw error
    }
    if (target.customClaims?.admin === true) {
      throw new HttpsError('failed-precondition', 'Remove administrator access before suspending this account.')
    }
  }

  const userRef = db.collection('users').doc(uid)
  const eventRef = db.collection('userStatusEvents').doc()

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists) throw new HttpsError('not-found', 'User profile not found.')

    const profile = snapshot.data()
    const fromStatus = profile.profileStatus || 'active'

    transaction.update(userRef, {
      profileStatus: status,
      profileStatusReason: status === 'suspended' ? reason : '',
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.create(eventRef, {
      uid,
      email: profile.email || '',
      fromStatus,
      toStatus: status,
      reason: status === 'suspended' ? reason : '',
      adminId: request.auth.uid,
      adminEmail: request.auth.token.email || '',
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  if (status === 'suspended') await auth.revokeRefreshTokens(uid)

  return { uid, status, reason: status === 'suspended' ? reason : '' }
}))
