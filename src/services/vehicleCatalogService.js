const API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'
const VEHICLE_TYPES = ['Passenger Car', 'Multipurpose Passenger Vehicle (MPV)', 'Truck']

const fallbackMakes = [
  [448, 'Toyota'], [474, 'Honda'], [460, 'Ford'], [498, 'Hyundai'],
  [467, 'Chevrolet'], [452, 'BMW'], [449, 'Mercedes-Benz'], [515, 'Lexus'],
  [584, 'Porsche'], [499, 'Kia'], [478, 'Nissan'], [441, 'Tesla'],
].map(([id, name]) => ({ id, name }))

let makesPromise
const modelPromises = new Map()

async function getResults(path) {
  const response = await fetch(`${API_BASE}/${path}?format=json`)
  if (!response.ok) throw new Error(`Vehicle catalog request failed: ${response.status}`)
  const payload = await response.json()
  return Array.isArray(payload.Results) ? payload.Results : []
}

export function getVehicleMakes() {
  if (!makesPromise) {
    // On failure the promise resolves to the fallback list but is dropped from the
    // cache, so a later call retries the API instead of being stuck with the
    // fallback forever.
    makesPromise = Promise.allSettled(VEHICLE_TYPES.map(type => getResults(`GetMakesForVehicleType/${encodeURIComponent(type)}`)))
      .then(results => {
        const uniqueMakes = new Map()
        results.forEach(result => {
          if (result.status !== 'fulfilled') return
          result.value.forEach(make => {
            const id = Number(make.MakeId)
            const name = String(make.MakeName || '').trim()
            if (id && name) uniqueMakes.set(id, { id, name })
          })
        })
        const makes = [...uniqueMakes.values()].sort((a, b) => a.name.localeCompare(b.name))
        if (makes.length) return makes
        makesPromise = null
        return fallbackMakes
      })
      .catch(() => {
        makesPromise = null
        return fallbackMakes
      })
  }
  return makesPromise
}

export function getVehicleModels(makeId) {
  if (!makeId) return Promise.resolve([])
  if (!modelPromises.has(makeId)) {
    // Same reasoning as getVehicleMakes: drop the cache entry on failure so the
    // next request for this make retries instead of reusing an empty result.
    modelPromises.set(makeId, getResults(`GetModelsForMakeId/${makeId}`)
      .then(results => {
        const names = new Set(results.map(model => String(model.Model_Name || '').trim()).filter(Boolean))
        return [...names].sort((a, b) => a.localeCompare(b))
      })
      .catch(() => {
        modelPromises.delete(makeId)
        return []
      }))
  }
  return modelPromises.get(makeId)
}
