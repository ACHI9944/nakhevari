import { useMemo } from 'react'

export function useAdminDashboardData({
  actionStatus,
  filter,
  items,
  profiles,
  profilesStatus,
  search,
  selectedCompanyId,
  selectedId,
  status,
}) {
  const listingCounts = useMemo(() => ({
    pending: items.filter(item => item.status === 'pending').length,
    published: items.filter(item => item.status === 'published').length,
    rejected: items.filter(item => item.status === 'rejected').length,
    draft: items.filter(item => item.status === 'draft').length,
    all: items.length,
  }), [items])

  const term = search.trim().toLowerCase()

  const visibleItems = useMemo(() => items.filter(item => (
    (filter === 'all' || item.status === filter)
    && (!term || [item.make, item.model, item.vin, item.sellerName, item.ownerEmail]
      .some(value => String(value || '').toLowerCase().includes(term)))
  )), [filter, items, term])

  const companies = useMemo(() => profiles.filter(profile => profile.accountType === 'company'), [profiles])

  const visibleCompanies = useMemo(() => companies.filter(profile => (
    !term || [profile.companyName, profile.identificationNumber, profile.email, profile.phone, profile.name]
      .some(value => String(value || '').toLowerCase().includes(term))
  )), [companies, term])

  const visibleProfiles = useMemo(() => profiles.filter(profile => (
    !term || [profile.name, profile.email, profile.phone, profile.companyName]
      .some(value => String(value || '').toLowerCase().includes(term))
  )), [profiles, term])

  const companyCounts = useMemo(() => ({
    pending: companies.filter(item => item.companyVerificationStatus === 'pending').length,
    verified: companies.filter(item => item.companyVerificationStatus === 'verified').length,
    rejected: companies.filter(item => item.companyVerificationStatus === 'rejected').length,
  }), [companies])

  return {
    acting: actionStatus === 'loading',
    companyCounts,
    loadingListings: status === 'idle' || status === 'loading',
    loadingProfiles: profilesStatus === 'idle' || profilesStatus === 'loading',
    selected: items.find(item => item.id === selectedId) || visibleItems[0] || null,
    selectedCompany: companies.find(item => item.uid === selectedCompanyId) || visibleCompanies[0] || null,
    visibleCompanies,
    visibleItems,
    visibleProfiles,
    listingCounts,
  }
}
