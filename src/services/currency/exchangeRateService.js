const nbgCurrenciesUrl = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json/'
const usdGelStorageKey = 'exchange-rate:USD_GEL'
const dayMs = 24 * 60 * 60 * 1000

let usdGelRatePromise

const parseCachedRate = value => {
  try {
    const cache = JSON.parse(value)
    if (!Number.isFinite(Number(cache?.rate)) || Number(cache.rate) <= 0) return null
    if (!Number.isFinite(Number(cache?.expiresAt)) || Date.now() >= Number(cache.expiresAt)) return null
    return {
      rate: Number(cache.rate),
      expiresAt: Number(cache.expiresAt),
      validFromDate: cache.validFromDate || '',
    }
  } catch {
    return null
  }
}

export function readCachedUsdGelRate() {
  if (typeof window === 'undefined') return null
  return parseCachedRate(window.localStorage.getItem(usdGelStorageKey))
}

const writeCachedUsdGelRate = ({ rate, validFromDate }) => {
  if (typeof window === 'undefined') return
  const validFromTime = Date.parse(validFromDate)
  const expiresAt = Number.isFinite(validFromTime) ? validFromTime + dayMs : Date.now() + dayMs
  window.localStorage.setItem(usdGelStorageKey, JSON.stringify({
    rate,
    validFromDate,
    expiresAt,
  }))
}

export async function getUsdGelRate() {
  const cached = readCachedUsdGelRate()
  if (cached) return cached.rate

  if (!usdGelRatePromise) {
    usdGelRatePromise = fetch(`${nbgCurrenciesUrl}?currencies=USD`)
      .then(async response => {
        if (!response.ok) throw new Error(`NBG exchange rate request failed: ${response.status}`)
        const payload = await response.json()
        const result = payload?.[0]
        const currency = result?.currencies?.find(item => item.code === 'USD')
        const rate = currency?.rate
        if (!Number.isFinite(Number(rate)) || Number(rate) <= 0) {
          throw new Error('NBG USD exchange rate is missing')
        }
        writeCachedUsdGelRate({
          rate: Number(rate),
          validFromDate: currency?.validFromDate || result?.date || '',
        })
        return Number(rate)
      })
      .catch(error => {
        usdGelRatePromise = null
        throw error
      })
  }
  return usdGelRatePromise
}
