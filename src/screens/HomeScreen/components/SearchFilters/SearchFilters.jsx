import { cx } from '../../../../utils/classNames'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronDown, DollarSign, Gauge, Search, SlidersHorizontal, X } from 'lucide-react'
import { useVehicleCatalog } from '../../../../hooks/useVehicleCatalog'
import { Button, RangeFilterPopover } from '../../../../components'
import { SearchableSelect } from '../../../../components/SearchableSelect/SearchableSelect'
import { listingFilterDefaults } from '../../../../utils/listingFilterParams'
import { buildListingFilterLabels, buildVehicleOptionGroups } from '../../../../utils/listingFilterDisplay'
import { mileageUnitOptions, priceCurrencyOptions } from '../../../../utils/listingFilterUnits'
import styles from './SearchFilters.module.css'

const advancedFieldNames = ['fuel', 'transmission', 'minMileage', 'maxMileage', 'mileageUnit', 'sellerType', 'transportStatus']

export function SearchFilters({ onSearch }) {
  const { t } = useTranslation()
  const [makeId, setMakeId] = useState('')
  const [filters, setFilters] = useState(() => ({ ...listingFilterDefaults }))
  const [openPopover, setOpenPopover] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { makes, models, makesLoading, modelsLoading } = useVehicleCatalog(makeId)
  const { fuelOptions, transmissionOptions, transportOptions } = buildVehicleOptionGroups(t)
  const { yearLabel, priceLabel, mileageLabel } = buildListingFilterLabels(filters, t)

  const updateFilter = (name, value) => {
    setFilters(current => ({ ...current, [name]: value }))
  }

  const resetAdvancedFields = () => {
    setFilters(current => advancedFieldNames.reduce((next, name) => ({ ...next, [name]: listingFilterDefaults[name] }), current))
  }

  const submit = event => {
    event.preventDefault()
    onSearch?.(filters)
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.title}>
        <Search size={18} className={styles.icon} />
        <span className={styles.titleText}>{t('filters.title')}</span>
      </div>
      <div className={styles.grid}>
        <label className={cx(styles.label, styles.keywordField)}>
          <span className={styles.labelText}>{t('filters.keyword')}</span>
          <input
            value={filters.q}
            onChange={event => updateFilter('q', event.target.value)}
            placeholder={t('filters.keywordPlaceholder')}
            className={styles.field}
          />
        </label>
        <div>
          <span className={styles.labelText}>{t('filters.make')}</span>
          <SearchableSelect
            value={filters.make}
            options={makes.map(item => ({ value: item.name, label: item.name, id: item.id }))}
            loading={makesLoading}
            placeholder={makesLoading ? t('filters.loadingMakes') : t('filters.allMakes')}
            searchPlaceholder={t('filters.searchMake')}
            emptyText={t('filters.noResults')}
            emptyOptionLabel={t('filters.allMakes')}
            onChange={(value, option) => {
              updateFilter('make', value)
              setMakeId(option?.id ? String(option.id) : '')
              updateFilter('model', '')
            }}
          />
        </div>
        <div>
          <span className={styles.labelText}>{t('filters.model')}</span>
          <SearchableSelect
            value={filters.model}
            options={models}
            disabled={!makeId}
            loading={modelsLoading}
            placeholder={
              modelsLoading
                ? t('filters.loadingModels')
                : makeId
                  ? t('filters.allModels')
                  : t('filters.selectMakeFirst')
            }
            searchPlaceholder={t('filters.searchModel')}
            emptyText={t('filters.noResults')}
            emptyOptionLabel={t('filters.allModels')}
            onChange={value => updateFilter('model', value)}
          />
        </div>
        <RangeFilterPopover
          name="year"
          label={t('filters.year')}
          value={yearLabel}
          open={openPopover === 'year'}
          onToggle={() => setOpenPopover(openPopover === 'year' ? '' : 'year')}
          onApply={() => setOpenPopover('')}
          icon={<CalendarDays size={18} />}
          minValue={filters.minYear}
          maxValue={filters.maxYear}
          minPlaceholder={t('listings.minYear')}
          maxPlaceholder={t('listings.maxYear')}
          onMinChange={value => updateFilter('minYear', value)}
          onMaxChange={value => updateFilter('maxYear', value)}
          size="large"
        />
        <RangeFilterPopover
          name="price"
          label={t('filters.price')}
          value={priceLabel}
          open={openPopover === 'price'}
          onToggle={() => setOpenPopover(openPopover === 'price' ? '' : 'price')}
          onApply={() => setOpenPopover('')}
          icon={filters.priceCurrency === 'gel' ? <span aria-hidden="true">₾</span> : <DollarSign size={19} />}
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          minPlaceholder={t('listings.minPrice')}
          maxPlaceholder={t('listings.maxPrice')}
          onMinChange={value => updateFilter('minPrice', value)}
          onMaxChange={value => updateFilter('maxPrice', value)}
          unitOptions={priceCurrencyOptions}
          unitValue={filters.priceCurrency}
          onUnitChange={value => updateFilter('priceCurrency', value)}
          size="large"
        />
        <button type="button" onClick={() => setAdvancedOpen(true)} className={styles.advancedButton}>
          <span className={styles.advancedIcon}><SlidersHorizontal size={17} /></span>
          <span className={styles.advancedText}>{t('listings.advanced')}</span>
        </button>
        <Button type="submit" className={styles.submit}>
          {t('common.search')}
        </Button>
      </div>
      {advancedOpen && <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setAdvancedOpen(false)}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="advanced-filters-title" onMouseDown={event => event.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 id="advanced-filters-title" className={styles.modalTitle}>{t('listings.advanced')}</h2>
            <button type="button" onClick={() => setAdvancedOpen(false)} className={styles.closeButton} aria-label={t('common.back')}><X size={22} /></button>
          </div>
          <div className={styles.modalBody}>
            <section>
              <h3 className={styles.modalSectionTitle}>{t('listings.vehicleInfo')}</h3>
              <div className={styles.modalGrid}>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t('listing.fuel')}</span>
                  <select value={filters.fuel} onChange={event => updateFilter('fuel', event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t('listings.anyFuel')}</option>
                    {fuelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t('listing.transmission')}</span>
                  <select value={filters.transmission} onChange={event => updateFilter('transmission', event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t('listings.anyTransmission')}</option>
                    {transmissionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <RangeFilterPopover
                  label={t('listing.mileage')}
                  value={mileageLabel}
                  open={openPopover === 'mileage'}
                  onToggle={() => setOpenPopover(openPopover === 'mileage' ? '' : 'mileage')}
                  onApply={() => setOpenPopover('')}
                  icon={<Gauge size={18} />}
                  minValue={filters.minMileage}
                  maxValue={filters.maxMileage}
                  minPlaceholder={t('listings.minMileage')}
                  maxPlaceholder={t('listings.maxMileage')}
                  onMinChange={value => updateFilter('minMileage', value)}
                  onMaxChange={value => updateFilter('maxMileage', value)}
                  unitOptions={mileageUnitOptions}
                  unitValue={filters.mileageUnit}
                  onUnitChange={value => updateFilter('mileageUnit', value)}
                  size="large"
                />
                <label className={styles.label}>
                  <span className={styles.labelText}>{t('add.sellerType')}</span>
                  <select value={filters.sellerType} onChange={event => updateFilter('sellerType', event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t('listings.anySeller')}</option>
                    <option value="individual">{t('common.individual')}</option>
                    <option value="company">{t('common.company')}</option>
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t('listings.transportStatus')}</span>
                  <select value={filters.transportStatus} onChange={event => updateFilter('transportStatus', event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t('listings.anyStatus')}</option>
                    {transportOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
              </div>
            </section>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={resetAdvancedFields} className={styles.clearButton}>{t('listings.reset')}</button>
            <Button type="button" onClick={() => setAdvancedOpen(false)} className={styles.modalApply}>{t('listings.apply')}</Button>
          </div>
        </section>
      </div>}
    </form>
  )
}
