const { HttpsError } = require('firebase-functions/v2/https')
const { auth } = require('./firebase')

async function assertAdmin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.')

  const user = await auth.getUser(request.auth.uid)
  if (user.customClaims?.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrator access is required.')
  }

  return user
}

module.exports = {
  assertAdmin,
}
