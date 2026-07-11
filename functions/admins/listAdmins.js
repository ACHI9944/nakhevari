const { onCall } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { auth } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

exports.listAdmins = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const admins = []
  let pageToken

  do {
    const page = await auth.listUsers(1000, pageToken)
    page.users.forEach(user => {
      if (user.customClaims?.admin === true) {
        admins.push({ uid: user.uid, email: user.email || '', displayName: user.displayName || '' })
      }
    })
    pageToken = page.pageToken
  } while (pageToken)

  return { admins: admins.sort((a, b) => a.email.localeCompare(b.email)) }
}))
