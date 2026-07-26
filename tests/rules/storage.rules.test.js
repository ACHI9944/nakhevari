import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'

const ownerUid = 'owner-1'
const otherUid = 'other-1'
const listingId = 'listing-1'
const filePath = `listing-images/${ownerUid}/${listingId}/photo.jpg`
const smallFile = new Uint8Array([1, 2, 3])
const oversizedFile = new Uint8Array(11 * 1024 * 1024)

const baseListing = {
  ownerId: ownerUid,
  status: 'pending',
}

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // Unlike the other rules test files, this one must use the project ID from
    // .firebaserc: firebase.json sets emulators.singleProjectMode, and storage.rules'
    // cross-service firestore.get()/firestore.exists() calls only resolve against that
    // single project's Firestore data, not an arbitrary test project ID. It won't race
    // with the other rules test files since none of them write to this project.
    projectId: 'nakhevari-ge',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
})

describe('listing-images/{userId}/{listingId}/{fileName} create rule', () => {
  it('lets a verified owner upload when no listing document exists yet', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertSucceeds(uploadBytes(ref(owner.storage(), filePath), smallFile, { contentType: 'image/jpeg' }))
  })

  it('rejects an upload from an unverified email', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: false })

    await assertFails(uploadBytes(ref(owner.storage(), filePath), smallFile, { contentType: 'image/jpeg' }))
  })

  it('rejects an upload under a different user id path', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })
    const otherPath = `listing-images/${otherUid}/${listingId}/photo.jpg`

    await assertFails(uploadBytes(ref(owner.storage(), otherPath), smallFile, { contentType: 'image/jpeg' }))
  })

  it('rejects a disallowed content type', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertFails(uploadBytes(ref(owner.storage(), filePath), smallFile, { contentType: 'application/pdf' }))
  })

  it('rejects a file larger than 10 MB', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertFails(uploadBytes(ref(owner.storage(), filePath), oversizedFile, { contentType: 'image/jpeg' }))
  })

  it('rejects uploads once the matching listing is no longer pending', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), { ...baseListing, status: 'published' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertFails(uploadBytes(ref(owner.storage(), filePath), smallFile, { contentType: 'image/jpeg' }))
  })

  it('lets the owner keep uploading while the matching listing is still pending', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), baseListing)
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertSucceeds(uploadBytes(ref(owner.storage(), filePath), smallFile, { contentType: 'image/jpeg' }))
  })
})

describe('listing-images/{userId}/{listingId}/{fileName} read rule', () => {
  it('allows anonymous reads', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await uploadBytes(ref(context.storage(), filePath), smallFile, { contentType: 'image/jpeg' })
    })
    const anon = testEnv.unauthenticatedContext()

    await assertSucceeds(getBytes(ref(anon.storage(), filePath)))
  })
})

describe('listing-images/{userId}/{listingId}/{fileName} delete rule', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await uploadBytes(ref(context.storage(), filePath), smallFile, { contentType: 'image/jpeg' })
    })
  })

  it('lets the owner delete while the listing is editable', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), baseListing)
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertSucceeds(deleteObject(ref(owner.storage(), filePath)))
  })

  it('rejects delete once the listing is no longer editable', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), { ...baseListing, status: 'published' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: 'owner@example.com', email_verified: true })

    await assertFails(deleteObject(ref(owner.storage(), filePath)))
  })

  it('rejects delete from a non-owner', async () => {
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })

    await assertFails(deleteObject(ref(other.storage(), filePath)))
  })
})
