const { onCall } = require('firebase-functions/v2/https')
const { assertAdmin } = require('../lib/auth')
const { REGION } = require('../lib/config')
const { db } = require('../lib/firebase')
const { wrapCallable } = require('../lib/https')

const listingStatuses = ['pending', 'published', 'rejected', 'draft', 'unpublished', 'sold']
const companyStatuses = ['pending', 'verified', 'rejected']

const count = async query => (await query.count().get()).data().count

exports.getAdminStats = onCall({ region: REGION }, wrapCallable(async request => {
  await assertAdmin(request)

  const usersRef = db.collection('users')
  const listingsRef = db.collection('listings')
  const companiesRef = usersRef.where('accountType', '==', 'company')

  const [
    listingCounts,
    listingsTotal,
    usersTotal,
    usersSuspended,
    companyCounts,
    companiesTotal,
  ] = await Promise.all([
    Promise.all(listingStatuses.map(status => count(listingsRef.where('status', '==', status)))),
    count(listingsRef),
    count(usersRef),
    count(usersRef.where('profileStatus', '==', 'suspended')),
    Promise.all(companyStatuses.map(status => count(companiesRef.where('companyVerificationStatus', '==', status)))),
    count(companiesRef),
  ])

  return {
    listings: {
      ...Object.fromEntries(listingStatuses.map((status, index) => [status, listingCounts[index]])),
      all: listingsTotal,
    },
    users: {
      active: usersTotal - usersSuspended,
      suspended: usersSuspended,
      all: usersTotal,
    },
    companies: {
      ...Object.fromEntries(companyStatuses.map((status, index) => [status, companyCounts[index]])),
      all: companiesTotal,
    },
  }
}))
