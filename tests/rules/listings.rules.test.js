import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const ownerUid = 'owner-1'
const ownerEmail = 'owner@example.com'
const otherUid = 'other-1'
const listingId = 'listing-1'

const individualProfile = {
  name: 'Owner One',
  email: ownerEmail,
  emailVerified: true,
  phone: '+995500000001',
  phoneVerified: false,
  accountType: 'individual',
  companyVerificationStatus: 'not_required',
  profileStatus: 'active',
  role: 'user',
  profileCompleted: true,
  createdAt: new Date('2026-01-01'),
}

const verifiedCompanyProfile = {
  ...individualProfile,
  accountType: 'company',
  companyName: 'Owner LLC',
  companyVerificationStatus: 'verified',
}

const buildListing = (overrides = {}) => ({
  make: 'Toyota',
  model: 'Camry',
  year: 2021,
  vin: '1HGCM82633A004352',
  mileage: 30000,
  fuel: 'gasoline',
  transmission: 'automatic',
  transportStatus: 'at_port',
  arrivalDate: '2026-03-01',
  sellerType: 'individual',
  ownerId: ownerUid,
  status: 'pending',
  image: `listing-images/${ownerUid}/${listingId}/0-a.jpg`,
  images: [`listing-images/${ownerUid}/${listingId}/0-a.jpg`],
  imagePath: `listing-images/${ownerUid}/${listingId}/0-a.jpg`,
  imagePaths: [`listing-images/${ownerUid}/${listingId}/0-a.jpg`],
  createdAt: new Date('2026-02-01'),
  updatedAt: new Date('2026-02-01'),
  vinSearch: '1hgcm82633a004352',
  makeModelSearch: 'toyota camry',
  ...overrides,
})

// Seller-identifying data + the seller's own asking price live in this
// subcollection, never on the public listing doc (see firestore.rules).
const buildSellerInfo = (overrides = {}) => ({
  ownerId: ownerUid,
  sellerName: 'Owner One',
  phone: '+995500000001',
  sellerPrice: 15000,
  ownerEmail,
  createdAt: new Date('2026-02-01'),
  updatedAt: new Date('2026-02-01'),
  ...overrides,
})

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // See the comment in tests/rules/users.rules.test.js: each rules test file
    // needs its own project ID to avoid cross-file clearFirestore() races.
    projectId: 'nakhevari-rules-test-listings',
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
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users', ownerUid), individualProfile)
    await setDoc(doc(context.firestore(), 'users', otherUid), individualProfile)
  })
})

describe('listings/{listingId} create rule', () => {
  it('lets a verified, signed-in individual create their own pending listing', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(setDoc(listingRef, buildListing()))
  })

  it('rejects create when the email is not verified', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: false })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(setDoc(listingRef, buildListing()))
  })

  it('rejects create when ownerId does not match the caller', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(setDoc(listingRef, buildListing({ ownerId: otherUid })))
  })

  it('rejects a company listing when the caller profile is an individual', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(setDoc(listingRef, buildListing({ sellerType: 'company' })))
  })

  it('lets a verified company profile create a company listing', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', ownerUid), verifiedCompanyProfile)
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(setDoc(listingRef, buildListing({ sellerType: 'company' })))
  })

  it('rejects create when a field outside the allowlist is present', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(setDoc(listingRef, buildListing({ notAllowed: 'x' })))
  })

  it('rejects create when a required field is missing', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)
    const { vin: _vin, ...withoutVin } = buildListing()

    await assertFails(setDoc(listingRef, withoutVin))
  })

  it('rejects create when the image path does not belong to the caller', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(setDoc(listingRef, buildListing({
      image: `listing-images/${otherUid}/${listingId}/0-a.jpg`,
      images: [`listing-images/${otherUid}/${listingId}/0-a.jpg`],
      imagePath: `listing-images/${otherUid}/${listingId}/0-a.jpg`,
      imagePaths: [`listing-images/${otherUid}/${listingId}/0-a.jpg`],
    })))
  })
})

describe('listings/{listingId} update rule', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), buildListing())
    })
  })

  it('lets the owner edit their own pending listing', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(updateDoc(listingRef, {
      mileage: 31000,
      updatedAt: new Date('2026-02-02'),
    }))
  })

  it('rejects edits from a non-owner', async () => {
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })
    const listingRef = doc(other.firestore(), 'listings', listingId)

    await assertFails(updateDoc(listingRef, { mileage: 31000 }))
  })

  it('rejects an attempt to change status directly instead of through moderation', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(updateDoc(listingRef, { status: 'published' }))
  })

  it('rejects an attempt to change ownerId', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(updateDoc(listingRef, { ownerId: otherUid }))
  })

  it('rejects edits once the listing is no longer pending', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status: 'published' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(updateDoc(listingRef, { mileage: 31000 }))
  })

  it.each(['published', 'rejected', 'unpublished'])('lets the owner edit a %s listing and forces it back to pending', async status => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(updateDoc(listingRef, {
      mileage: 31000,
      status: 'pending',
      updatedAt: new Date('2026-02-02'),
    }))
    let snapshot
    await testEnv.withSecurityRulesDisabled(async context => {
      snapshot = await getDoc(doc(context.firestore(), 'listings', listingId))
    })
    if (snapshot.data().status !== 'pending') throw new Error('Expected the listing to revert to pending.')
  })

  it('rejects edits once the listing is sold, even when the payload sets status back to pending', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status: 'sold' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertFails(updateDoc(listingRef, { mileage: 31000, status: 'pending' }))
  })
})

describe('listings/{listingId}/private/sellerInfo rules', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), buildListing())
    })
  })

  it('lets the owner create their own seller info', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertSucceeds(setDoc(sellerInfoRef, buildSellerInfo()))
  })

  it('rejects create when ownerId does not match the caller', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertFails(setDoc(sellerInfoRef, buildSellerInfo({ ownerId: otherUid })))
  })

  it('rejects a company seller whose companyName does not match the profile', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', ownerUid), verifiedCompanyProfile)
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertFails(setDoc(sellerInfoRef, buildSellerInfo({
      companyName: 'A Different Company',
      companyVerificationStatus: 'verified',
    })))
  })

  it('lets a verified company set a matching companyName', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', ownerUid), verifiedCompanyProfile)
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertSucceeds(setDoc(sellerInfoRef, buildSellerInfo({
      companyName: 'Owner LLC',
      companyVerificationStatus: 'verified',
    })))
  })

  it('lets the owner and an admin read the seller info, but not another user', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const admin = testEnv.authenticatedContext('admin-1', { email: 'admin@example.com', admin: true })
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })

    await assertSucceeds(getDoc(doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')))
    await assertSucceeds(getDoc(doc(admin.firestore(), 'listings', listingId, 'private', 'sellerInfo')))
    await assertFails(getDoc(doc(other.firestore(), 'listings', listingId, 'private', 'sellerInfo')))
  })

  it('lets the owner update their seller info while the listing is pending', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertSucceeds(updateDoc(sellerInfoRef, { sellerPrice: 16000 }))
  })

  it('rejects updates once the listing is sold', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status: 'sold' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertFails(updateDoc(sellerInfoRef, { sellerPrice: 16000 }))
  })

  it.each(['published', 'rejected', 'unpublished'])('lets the owner update seller info while the listing is %s', async status => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertSucceeds(updateDoc(sellerInfoRef, { sellerPrice: 16000 }))
  })

  it('rejects updates from a non-owner', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
    })
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })
    const sellerInfoRef = doc(other.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertFails(updateDoc(sellerInfoRef, { sellerPrice: 16000 }))
  })

  it('lets the owner delete their seller info', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const sellerInfoRef = doc(owner.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertSucceeds(deleteDoc(sellerInfoRef))
  })

  it('rejects delete from a non-owner', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId, 'private', 'sellerInfo'), buildSellerInfo())
    })
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })
    const sellerInfoRef = doc(other.firestore(), 'listings', listingId, 'private', 'sellerInfo')

    await assertFails(deleteDoc(sellerInfoRef))
  })
})

describe('listings/{listingId} delete rule', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), buildListing())
    })
  })

  it('lets the owner delete their own listing', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(deleteDoc(listingRef))
  })

  it('lets the owner delete even a published listing', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status: 'published' })
    })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })
    const listingRef = doc(owner.firestore(), 'listings', listingId)

    await assertSucceeds(deleteDoc(listingRef))
  })

  it('rejects delete from a non-owner', async () => {
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })
    const listingRef = doc(other.firestore(), 'listings', listingId)

    await assertFails(deleteDoc(listingRef))
  })
})

describe('listings/{listingId} read rule', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listings', listingId), buildListing())
    })
  })

  it('lets anyone read a published listing', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), 'listings', listingId), { status: 'published' })
    })
    const anon = testEnv.unauthenticatedContext()

    await assertSucceeds(getDoc(doc(anon.firestore(), 'listings', listingId)))
  })

  it('rejects an anonymous read of a pending listing', async () => {
    const anon = testEnv.unauthenticatedContext()

    await assertFails(getDoc(doc(anon.firestore(), 'listings', listingId)))
  })

  it('rejects a signed-in non-owner from reading a pending listing', async () => {
    const other = testEnv.authenticatedContext(otherUid, { email: 'other@example.com', email_verified: true })

    await assertFails(getDoc(doc(other.firestore(), 'listings', listingId)))
  })

  it('lets an admin read a pending listing owned by someone else', async () => {
    const admin = testEnv.authenticatedContext('admin-1', { email: 'admin@example.com', admin: true })

    await assertSucceeds(getDoc(doc(admin.firestore(), 'listings', listingId)))
  })
})

describe('audit event collections', () => {
  it('rejects client writes to listingModerationEvents', async () => {
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })

    await assertFails(setDoc(doc(owner.firestore(), 'listingModerationEvents', 'event-1'), { listingId }))
  })

  it('lets an admin read listingModerationEvents but not a regular user', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'listingModerationEvents', 'event-1'), { listingId })
    })
    const admin = testEnv.authenticatedContext('admin-1', { email: 'admin@example.com', admin: true })
    const owner = testEnv.authenticatedContext(ownerUid, { email: ownerEmail, email_verified: true })

    await assertSucceeds(getDoc(doc(admin.firestore(), 'listingModerationEvents', 'event-1')))
    await assertFails(getDoc(doc(owner.firestore(), 'listingModerationEvents', 'event-1')))
  })
})
