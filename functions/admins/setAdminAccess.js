const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { auth, db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

exports.setAdminAccess = onCall({ region: REGION }, wrapCallable(async request => {
  const actor = await assertAdmin(request)
  const email = typeof request.data?.email === 'string' ? request.data.email.trim().toLowerCase() : ''
  const enabled = request.data?.enabled

  if (!email || typeof enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'A valid email and access value are required.')
  }

  let target
  try {
    target = await auth.getUserByEmail(email)
  } catch (error) {
    if (error.code === 'auth/user-not-found') throw new HttpsError('not-found', 'User not found.')
    throw error
  }

  if (!enabled && target.uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot remove your own administrator access.')
  }

  const claims = { ...(target.customClaims || {}) }
  if (enabled) claims.admin = true
  else delete claims.admin

  const eventRef = db.collection('adminAccessEvents').doc()
  await eventRef.create({
    targetUid: target.uid,
    targetEmail: target.email || email,
    enabled,
    actorUid: actor.uid,
    actorEmail: actor.email || '',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  try {
    await auth.setCustomUserClaims(target.uid, claims)
    if (!enabled) await auth.revokeRefreshTokens(target.uid)

    await eventRef.update({
      status: 'applied',
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    await eventRef.update({
      status: 'failed',
      errorCode: typeof error.code === 'string' ? error.code : 'unknown',
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {})
    throw error
  }

  return { uid: target.uid, email: target.email || email, displayName: target.displayName || '', enabled }
}))
