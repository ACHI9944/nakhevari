import { describe, expect, it } from 'vitest'
import { platformContact } from '../../src/config/platformContact'
import { presentListingCard, presentListingDetail } from '../../src/utils/listingPresenter'

const t = key => key

describe('presentListingCard', () => {
  const baseItem = {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    publicPrice: 20000,
    mileage: 15000,
    fuel: 'gasoline',
    transmission: 'automatic',
    transportStatus: 'in_transit',
    sellerType: 'individual',
    sellerName: 'Nino',
  }

  it('computes a market price from publicPrice when none is provided', () => {
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

  it('always shows the platform as the seller, regardless of the original seller data', () => {
    const card = presentListingCard({
      ...baseItem,
      sellerType: 'company',
      companyName: 'Verified Cars GE',
      companyVerificationStatus: 'verified',
    }, t)
    expect(card.sellerDisplayName).toBe(platformContact.name)
  })
})

describe('presentListingDetail', () => {
  const baseListing = {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    publicPrice: 20000,
    mileage: 15000,
    sellerType: 'individual',
    sellerName: 'Nino',
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

  it('always shows the platform contact, regardless of the original seller data', () => {
    const detail = presentListingDetail({ ...baseListing, sellerName: 'Nino', phone: '+995 555 12 34 56' }, t)
    expect(detail.sellerDisplayName).toBe(platformContact.name)
    expect(detail.phoneHref).toBe(platformContact.phoneHref)
    expect(detail.whatsappHref).toBe(platformContact.whatsappHref)
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
