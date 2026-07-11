import { useEffect, useState } from 'react'
import { getUsdGelRate, readCachedUsdGelRate } from '../services/currency/exchangeRateService'
import { fallbackGelPerUsd } from '../utils/listingFilterUnits'

export function useUsdGelRate() {
  const [state, setState] = useState(() => {
    const cached = readCachedUsdGelRate()
    return cached
      ? { rate: cached.rate, status: 'succeeded' }
      : { rate: fallbackGelPerUsd, status: 'loading' }
  })

  useEffect(() => {
    let active = true
    let refreshTimer
    const refresh = () => getUsdGelRate()
      .then(rate => {
        if (active) {
          setState(current => (
            current.rate === rate && current.status === 'succeeded'
              ? current
              : { rate, status: 'succeeded' }
          ))
        }
      })
      .catch(() => {
        if (active) setState({ rate: fallbackGelPerUsd, status: 'failed' })
      })

    const cached = readCachedUsdGelRate()
    if (cached) {
      refreshTimer = window.setTimeout(refresh, Math.max(cached.expiresAt - Date.now() + 1000, 1000))
    } else {
      refresh()
    }

    return () => {
      active = false
      if (refreshTimer) window.clearTimeout(refreshTimer)
    }
  }, [])

  return state
}
