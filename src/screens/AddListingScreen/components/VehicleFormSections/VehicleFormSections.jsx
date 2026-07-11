import { DatePicker } from '../../../../components/DatePicker/DatePicker'
import { SearchableSelect } from '../../../../components/SearchableSelect/SearchableSelect'
import { formGroups, localizeVehicleOptions } from '../../../../data/listingForm'
import styles from './VehicleFormSections.module.css'

export function VehicleFormSections({
  arrivalDate,
  firstArrivalDate,
  lastArrivalDate,
  makeId,
  makes,
  makesLoading,
  models,
  modelsLoading,
  onArrivalDateChange,
  onMakeChange,
  onModelChange,
  onSelectChange,
  selectValues,
  t,
  vehicleMake,
  vehicleModel,
}) {
  return formGroups.map(([titleKey, fields]) => (
    <section key={titleKey} className={styles.card}>
      <h2 className={styles.cardTitle}>{t(titleKey)}</h2>
      <div className={styles.grid}>
        {fields.map(({ labelKey, name, type, options }) => {
          const label = t(labelKey)
          return (
          <div key={name}>
            <span className={styles.label}>{label}</span>
            {type === 'vehicleMake' ? (
              <SearchableSelect
                name={name}
                value={vehicleMake}
                options={makes.map(make => ({ value: make.name, label: make.name, id: make.id }))}
                loading={makesLoading}
                placeholder={makesLoading ? t('filters.loadingMakes') : t('common.select')}
                searchPlaceholder={t('filters.searchMake')}
                emptyText={t('filters.noResults')}
                onChange={onMakeChange}
              />
            ) : type === 'vehicleModel' ? (
              <SearchableSelect
                name={name}
                value={vehicleModel}
                options={models}
                disabled={!makeId}
                loading={modelsLoading}
                placeholder={modelsLoading ? t('filters.loadingModels') : makeId ? t('common.select') : t('filters.selectMakeFirst')}
                searchPlaceholder={t('filters.searchModel')}
                emptyText={t('filters.noResults')}
                onChange={onModelChange}
              />
            ) : type === 'select' ? (
              <SearchableSelect
                name={name}
                value={selectValues[name] || ''}
                options={localizeVehicleOptions(options, t)}
                placeholder={t('common.select')}
                searchPlaceholder={t('filters.searchOption')}
                emptyText={t('filters.noResults')}
                onChange={value => onSelectChange(name, value)}
              />
            ) : type === 'date' ? (
              <DatePicker
                name={name}
                value={arrivalDate}
                onChange={onArrivalDateChange}
                placeholder={label}
                minDate={firstArrivalDate}
                maxDate={lastArrivalDate}
                initialMonth={firstArrivalDate}
              />
            ) : (
              <input
                name={name}
                className={styles.field}
                type={type}
                min={type === 'number' ? 0 : undefined}
                placeholder={label}
                required
              />
            )}
          </div>
        )})}
      </div>
    </section>
  ))
}
