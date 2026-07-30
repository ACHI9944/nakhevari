const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')

initializeApp()

const auth = getAuth()
const db = getFirestore()
const storage = getStorage()

module.exports = {
  auth,
  db,
  storage,
  FieldValue,
}
