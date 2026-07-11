import { describe, expect, it } from 'vitest'
import { presentListingCard, presentListingDetail } from '../../src/utils/listingPresenter'

const t = key => key

describe('presentListingCard', () => {
  const baseItem = {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    price: 20000,
    mileage: 15000,
    fuel: 'gasoline',
    transmission: 'automatic',
    transportStatus: 'in_transit',
    sellerType: 'individual',
    sellerName: 'Nino',
  }

  it('computes a market price from price when none is provided', () => {
    const card = presentListingCard(baseItem, t)
    expect(card.market).toBe(Math.round(20000 * 1.22))
  })

  it('keeps an explicit market price untouched', () => {
    const card = presentListingCard({ ...baseItem, market: 25000 }, t)
    expect(card.market).toBe(25000)
  })

  it('formats mileage with the translated unit', () => {
    const card = presentListingCard(baseItem, t)
    expect(card.mileage).toBe('15,000 listing.km')
  })

  it('labels an individual seller by name', () => {
    const card = presentListingCard(baseItem, t)
    expect(card.sellerDisplayName).toBe('Nino')
    expect(card.isVerifiedCompany).toBe(false)
  })

  it('prefers companyName for a verified company seller', () => {
    const card = presentListingCard({
      ...baseItem,
      sellerType: 'company',
      companyName: 'Verified Cars GE',
      companyVerificationStatus: 'verified',
    }, t)
    expect(card.sellerDisplayName).toBe('Verified Cars GE')
    expect(card.isVerifiedCompany).toBe(true)
  })

  it('does not mark an unverified company as verified', () => {
    const card = presentListingCard({ ...baseItem, sellerType: 'company', companyVerificationStatus: 'pending' }, t)
    expect(card.isVerifiedCompany).toBe(false)
  })
})

describe('presentListingDetail', () => {
  const baseListing = {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    price: 20000,
    mileage: 15000,
    sellerType: 'individual',
    sellerName: 'Nino',
    phone: '+995 555 12 34 56',
    image: 'https://example.com/a.jpg',
    images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  }

  it('shows a percentage saving when the market price is above the listed price', () => {
    const detail = presentListingDetail({ ...baseListing, market: 25000 }, t)
    expect(detail.saving).toBe('−20%')
  })

  it('falls back to the in-transit label when there is no saving', () => {
    const detail = presentListingDetail({ ...baseListing, market: 20000 }, t)
    expect(detail.saving).toBe('home.inTransit')
  })

  it('builds tel: and wa.me hrefs from a Georgian mobile number', () => {
    const detail = presentListingDetail(baseListing, t)
    expect(detail.phoneHref).toBe('tel:+995 555 12 34 56')
    expect(detail.whatsappHref).toBe('https://wa.me/995555123456')
  })

  it('omits the whatsapp href when there is no phone number', () => {
    const detail = presentListingDetail({ ...baseListing, phone: '' }, t)
    expect(detail.phoneHref).toBe('')
    expect(detail.whatsappHref).toBe('')
  })

  it('deduplicates the image list and keeps the primary image first', () => {
    const detail = presentListingDetail({ ...baseListing, image: baseListing.images[0] }, t)
    expect(detail.images).toEqual(baseListing.images)
  })

  it('falls back to a placeholder image when the listing has none', () => {
    const detail = presentListingDetail({ ...baseListing, image: '', images: [] }, t)
    expect(detail.images).toHaveLength(1)
    expect(detail.image).toBe(detail.images[0])
  })
})
