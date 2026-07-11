const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore, FieldPath } = require('firebase-admin/firestore')

const args = new Set(process.argv.slice(2))
const getArgValue = name => {
  const prefix = `${name}=`
  const match = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  return match ? match.slice(prefix.length) : ''
}

const write = args.has('--write')
const status = getArgValue('--status') || 'published'
const projectId = getArgValue('--project') || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
const limitValue = Number(getArgValue('--limit') || 0)
const maxDocs = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : Infinity
const pageSize = 400

const listingQuery = (listingsRef, lastDocument, remaining) => {
  const size = Math.min(pageSize, remaining)
  let query = status === 'all'
    ? listingsRef.orderBy(FieldPath.documentId())
    : listingsRef.where('status', '==', status).orderBy(FieldPath.documentId())

  if (lastDocument) query = query.startAfter(lastDocument)
  return query.limit(size)
}

async function main() {
  const { buildListingSearchFields } = await import('../../src/utils/listingSearch.js')

  initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  })
  const db = getFirestore()
  const listingsRef = db.collection('listings')
  let checked = 0
  let changed = 0
  let lastDocument = null

  while (checked < maxDocs) {
    const remaining = maxDocs - checked
    const snapshot = await listingQuery(listingsRef, lastDocument, remaining).get()
    if (snapshot.empty) break

    const batch = db.batch()
    let batchChanges = 0

    snapshot.docs.forEach(document => {
      checked += 1
      const data = document.data()
      const searchFields = buildListingSearchFields(data)
      const needsUpdate = Object.entries(searchFields).some(([key, value]) => data[key] !== value)

      if (!needsUpdate) return

      changed += 1
      batchChanges += 1
      if (write) batch.update(document.ref, searchFields)

      if (changed <= 10) {
        console.log(`${write ? 'Will update' : 'Would update'} ${document.id}`, searchFields)
      }
    })

    if (write && batchChanges) await batch.commit()
    lastDocument = snapshot.docs[snapshot.docs.length - 1]
    if (snapshot.size < Math.min(pageSize, remaining)) break
  }

  console.log(`${write ? 'Updated' : 'Dry run'} ${changed} of ${checked} checked listings.`)
  if (!write && changed) console.log('Run with --write to apply these updates.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
