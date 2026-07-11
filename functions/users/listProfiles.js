const { onCall } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

exports.listProfiles = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const requestedLimit = Number(request.data?.limit) || 100
  const limit = Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
  const snapshot = await db.collection('users')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return {
    users: snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        uid: doc.id,
        name: data.name || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        accountType: data.accountType || 'individual',
        companyName: data.companyName || '',
        identificationNumber: data.identificationNumber || '',
        companyVerificationStatus: data.companyVerificationStatus || (data.accountType === 'company' ? 'pending' : 'not_required'),
        profileStatus: data.profileStatus || 'active',
        emailVerified: data.emailVerified === true,
        phoneVerified: data.phoneVerified === true,
        profileCompleted: data.profileCompleted === true,
        createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : null,
        updatedAt: typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : null,
      }
    }),
  }
}))
