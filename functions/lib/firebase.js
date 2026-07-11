const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()

const auth = getAuth()
const db = getFirestore()

module.exports = {
  auth,
  db,
  FieldValue,
}
