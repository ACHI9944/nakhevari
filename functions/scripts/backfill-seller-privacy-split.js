const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore, FieldPath, FieldValue } = require('firebase-admin/firestore')

const args = new Set(process.argv.slice(2))
const getArgValue = name => {
  const prefix = `${name}=`
  const match = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  return match ? match.slice(prefix.length) : ''
}

const write = args.has('--write')
const projectId = getArgValue('--project') || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
const limitValue = Number(getArgValue('--limit') || 0)
const maxDocs = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : Infinity
const pageSize = 400
const privateFields = ['sellerName', 'phone', 'ownerEmail', 'companyName', 'companyVerificationStatus']

function buildSellerInfo(data) {
  const sellerInfo = { ownerId: data.ownerId, sellerPrice: Number(data.price) || 0 }
  privateFields.forEach(field => {
    if (field in data) sellerInfo[field] = data[field]
  })
  return sellerInfo
}

async function main() {
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
    const size = Math.min(pageSize, remaining)
    let query = listingsRef.orderBy(FieldPath.documentId()).limit(size)
    if (lastDocument) query = query.startAfter(lastDocument)

    const snapshot = await query.get()
    if (snapshot.empty) break

    const batch = db.batch()
    let batchChanges = 0

    snapshot.docs.forEach(document => {
      checked += 1
      const data = document.data()
      if (data.schemaVersion >= 2) return

      changed += 1
      batchChanges += 1

      if (write) {
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

      if (changed <= 10) console.log(`${write ? 'Migrated' : 'Would migrate'} ${document.id}`)
    })

    if (write && batchChanges) await batch.commit()
    lastDocument = snapshot.docs[snapshot.docs.length - 1]
    if (snapshot.size < size) break
  }

  console.log(`${write ? 'Migrated' : 'Dry run'} ${changed} of ${checked} checked listings.`)
  if (!write && changed) console.log('Run with --write to apply these updates.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
