const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldPath } = require('firebase-admin/firestore')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db, FieldValue } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const maxLimit = 400
const privateFields = ['sellerName', 'phone', 'ownerEmail', 'companyName', 'companyVerificationStatus']

function buildSellerInfo(data) {
  const sellerInfo = { ownerId: data.ownerId, sellerPrice: Number(data.price) || 0 }
  privateFields.forEach(field => {
    if (field in data) sellerInfo[field] = data[field]
  })
  return sellerInfo
}

exports.backfillSellerPrivacySplit = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const dryRun = request.data?.dryRun !== false
  const limit = Number(request.data?.limit || 100)
  const cursor = typeof request.data?.cursor === 'string' ? request.data.cursor : ''
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), maxLimit) : 100

  let query = db.collection('listings').orderBy(FieldPath.documentId())
  if (cursor) {
    const cursorSnapshot = await db.collection('listings').doc(cursor).get()
    if (!cursorSnapshot.exists) throw new HttpsError('invalid-argument', 'The cursor listing was not found.')
    query = query.startAfter(cursorSnapshot)
  }

  const snapshot = await query.limit(safeLimit).get()
  const batch = db.batch()
  const samples = []
  let changed = 0

  snapshot.docs.forEach(document => {
    const data = document.data()
    if (data.schemaVersion >= 2) return

    changed += 1
    if (!dryRun) {
      const sellerInfoRef = document.ref.collection('private').doc('sellerInfo')
      batch.set(sellerInfoRef, {
        ...buildSellerInfo(data),
        createdAt: data.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      batch.update(document.ref, {
        schemaVersion: 2,
        updatedAt: FieldValue.serverTimestamp(),
        ...(data.status === 'published' ? { publicPrice: Number(data.price) || 0 } : {}),
        price: FieldValue.delete(),
        sellerName: FieldValue.delete(),
        phone: FieldValue.delete(),
        ownerEmail: FieldValue.delete(),
        companyName: FieldValue.delete(),
        companyVerificationStatus: FieldValue.delete(),
        sellerSearch: FieldValue.delete(),
      })
    }
    if (samples.length < 10) samples.push(document.id)
  })

  if (!dryRun && changed) await batch.commit()

  const lastDocument = snapshot.docs[snapshot.docs.length - 1]

  return {
    checked: snapshot.size,
    changed,
    dryRun,
    nextCursor: snapshot.size === safeLimit && lastDocument ? lastDocument.id : '',
    samples,
  }
}))
