export const vehicleOptionGroups = {
  fuel: [
    { value: 'gasoline', legacyValues: ['ბენზინი'], labelKey: 'vehicleOptions.fuel.gasoline' },
    { value: 'hybrid', legacyValues: ['ჰიბრიდი'], labelKey: 'vehicleOptions.fuel.hybrid' },
    { value: 'plug_in_hybrid', legacyValues: ['Plug-in ჰიბრიდი'], labelKey: 'vehicleOptions.fuel.plugInHybrid' },
    { value: 'electric', legacyValues: ['ელექტრო'], labelKey: 'vehicleOptions.fuel.electric' },
    { value: 'diesel', legacyValues: ['დიზელი'], labelKey: 'vehicleOptions.fuel.diesel' },
  ],
  transmission: [
    { value: 'automatic', legacyValues: ['ავტომატიკა'], labelKey: 'vehicleOptions.transmission.automatic' },
    { value: 'manual', legacyValues: ['მექანიკა'], labelKey: 'vehicleOptions.transmission.manual' },
  ],
  transportStatus: [
    { value: 'purchased_at_auction', legacyValues: ['აუქციონზე შეძენილია'], labelKey: 'vehicleOptions.transportStatus.purchasedAtAuction' },
    { value: 'at_port', legacyValues: ['პორტშია'], labelKey: 'vehicleOptions.transportStatus.atPort' },
    { value: 'on_ship', legacyValues: ['გემზეა'], labelKey: 'vehicleOptions.transportStatus.onShip' },
    { value: 'in_transit', legacyValues: ['გზაშია'], labelKey: 'vehicleOptions.transportStatus.inTransit' },
  ],
}

export const formGroups = [
  [
    'add.vehicleInfo',
    [
      { labelKey: 'filters.make', name: 'make', type: 'vehicleMake' },
      { labelKey: 'filters.model', name: 'model', type: 'vehicleModel' },
      { labelKey: 'listing.year', name: 'year', type: 'number' },
      { labelKey: 'add.priceUsd', name: 'price', type: 'number' },
      { labelKey: 'listing.vin', name: 'vin', type: 'text' },
      { labelKey: 'add.mileageKm', name: 'mileage', type: 'number' },
    ],
  ],
  [
    'add.technicalDetails',
    [
      { labelKey: 'vehicleOptions.fuel.label', name: 'fuel', type: 'select', options: vehicleOptionGroups.fuel },
      { labelKey: 'vehicleOptions.transmission.label', name: 'transmission', type: 'select', options: vehicleOptionGroups.transmission },
      { labelKey: 'vehicleOptions.transportStatus.label', name: 'transportStatus', type: 'select', options: vehicleOptionGroups.transportStatus },
      { labelKey: 'add.estimatedArrivalDate', name: 'arrivalDate', type: 'date' },
    ],
  ],
]

export const localizeVehicleOptions = (options, t) => (
  options.map(option => ({ value: option.value, label: t(option.labelKey) }))
)

export const findVehicleOption = (groupName, value) => {
  const options = vehicleOptionGroups[groupName] || []
  return options.find(option => (
    option.value === value || option.legacyValues?.includes(value)
  ))
}

export const normalizeVehicleOptionValue = (groupName, value) => (
  findVehicleOption(groupName, value)?.value || value || ''
)

export const vehicleOptionLabel = (groupName, value, t) => {
  const option = findVehicleOption(groupName, value)
  return option ? t(option.labelKey) : value || ''
}
