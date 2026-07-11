const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldPath } = require('firebase-admin/firestore')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')
const { buildListingSearchFields } = require('../lib/listingSearch')

const maxLimit = 400

exports.backfillListingSearchFields = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const dryRun = request.data?.dryRun !== false
  const status = typeof request.data?.status === 'string' ? request.data.status : 'published'
  const limit = Number(request.data?.limit || 100)
  const cursor = typeof request.data?.cursor === 'string' ? request.data.cursor : ''
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), maxLimit) : 100

  if (!['published', 'pending', 'rejected', 'draft', 'all'].includes(status)) {
    throw new HttpsError('invalid-argument', 'A valid listing status is required.')
  }

  let query = status === 'all'
    ? db.collection('listings').orderBy(FieldPath.documentId())
    : db.collection('listings').where('status', '==', status).orderBy(FieldPath.documentId())

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
    const searchFields = buildListingSearchFields(data)
    const needsUpdate = Object.entries(searchFields).some(([key, value]) => data[key] !== value)

    if (!needsUpdate) return

    changed += 1
    if (!dryRun) batch.update(document.ref, searchFields)
    if (samples.length < 10) samples.push({ id: document.id, searchFields })
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
