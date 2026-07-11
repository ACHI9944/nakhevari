import { useEffect, useState } from 'react'
import { getVehicleMakes, getVehicleModels } from '../services/vehicleCatalogService'

export function useVehicleCatalog(makeId) {
  const [makes, setMakes] = useState([])
  const [modelState, setModelState] = useState({ makeId: '', items: [] })
  const [makesLoading, setMakesLoading] = useState(true)

  useEffect(() => {
    let active = true
    getVehicleMakes().then(items => active && setMakes(items)).finally(() => active && setMakesLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (!makeId) return () => { active = false }
    getVehicleModels(makeId).then(items => active && setModelState({ makeId: String(makeId), items }))
    return () => { active = false }
  }, [makeId])

  const hasCurrentModels = modelState.makeId === String(makeId)
  return {
    makes,
    models: hasCurrentModels ? modelState.items : [],
    makesLoading,
    modelsLoading: Boolean(makeId) && !hasCurrentModels,
  }
}
