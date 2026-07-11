const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const uid = process.argv[2]
if (!uid) {
  console.error('Usage: node scripts/set-admin.js <firebase-uid>')
  process.exit(1)
}

initializeApp({ credential: applicationDefault() })

getAuth().getUser(uid)
  .then(user => getAuth().setCustomUserClaims(uid, { ...user.customClaims, admin: true }))
  .then(() => console.log(`Admin claim granted to ${uid}. The user must sign in again.`))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
