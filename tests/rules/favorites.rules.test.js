import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

const ownerUid = 'buyer-1'
const otherUid = 'buyer-2'
const listingId = 'listing-1'

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // Own project ID so this file's clearFirestore() can't race other rules test files.
    projectId: 'nakhevari-rules-test-favorites',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

function favoriteRef(context, uid) {
  return doc(context.firestore(), 'users', uid, 'favorites', listingId)
}

describe('users/{userId}/favorites/{listingId} rules', () => {
  it('lets the owner create, read, and delete their own favorite', async () => {
    const owner = testEnv.authenticatedContext(ownerUid)

    await assertSucceeds(setDoc(favoriteRef(owner, ownerUid), { createdAt: serverTimestamp() }))
    await assertSucceeds(getDoc(favoriteRef(owner, ownerUid)))
    await assertSucceeds(deleteDoc(favoriteRef(owner, ownerUid)))
  })

  it('rejects a create with fields other than createdAt', async () => {
    const owner = testEnv.authenticatedContext(ownerUid)

    await assertFails(setDoc(favoriteRef(owner, ownerUid), { createdAt: serverTimestamp(), listingId }))
  })

  it('rejects updates to an existing favorite', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(favoriteRef(context, ownerUid), { createdAt: new Date('2026-01-01') })
    })

    const owner = testEnv.authenticatedContext(ownerUid)
    await assertFails(setDoc(favoriteRef(owner, ownerUid), { createdAt: serverTimestamp() }, { merge: true }))
  })

  it('rejects another signed-in user reading, creating, or deleting someone else\'s favorite', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(favoriteRef(context, ownerUid), { createdAt: new Date('2026-01-01') })
    })

    const other = testEnv.authenticatedContext(otherUid)
    await assertFails(getDoc(favoriteRef(other, ownerUid)))
    await assertFails(setDoc(favoriteRef(other, ownerUid), { createdAt: serverTimestamp() }))
    await assertFails(deleteDoc(favoriteRef(other, ownerUid)))
  })

  it('rejects an anonymous client', async () => {
    const anon = testEnv.unauthenticatedContext()

    await assertFails(getDoc(favoriteRef(anon, ownerUid)))
    await assertFails(setDoc(favoriteRef(anon, ownerUid), { createdAt: serverTimestamp() }))
  })
})
