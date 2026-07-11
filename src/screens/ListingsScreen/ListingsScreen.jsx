import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, CalendarDays, ChevronDown, DollarSign, Gauge, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button, Footer, Header, RangeFilterPopover } from '../../components'
import { SearchableSelect } from '../../components/SearchableSelect/SearchableSelect'
import { formGroups, localizeVehicleOptions } from '../../data/listingForm'
import { fetchPublishedListings } from '../../store/listingsSlice'
import { useUsdGelRate } from '../../hooks/useUsdGelRate'
import { useVehicleCatalog } from '../../hooks/useVehicleCatalog'
import {
  listingFiltersFromSearchParams,
  listingFiltersToSearchParams,
  removeListingFilterParam,
} from '../../utils/listingFilterParams'
import {
  mileageUnitLabel,
  mileageUnitOptions,
  priceCurrencyOptions,
  priceCurrencySymbol,
  toBaseListingFilters,
} from '../../utils/listingFilterUnits'
import { presentListingCard } from '../../utils/listingPresenter'
import { CarCard } from '../HomeScreen/components'
import styles from './ListingsScreen.module.css'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export function Listings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [params, setParams] = useSearchParams()
  const { cursorToken, hasMore, items, loadingMore, status, error } = useSelector(state => state.listings.published)
  const appliedFilters = useMemo(() => listingFiltersFromSearchParams(params), [params])
  const [filters, setFilters] = useState(() => listingFiltersFromSearchParams(params))
  const [resultCurrency, setResultCurrency] = useState(() => listingFiltersFromSearchParams(params).priceCurrency)
  const [makeId, setMakeId] = useState('')
  const [openPopover, setOpenPopover] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { makes, models, makesLoading, modelsLoading } = useVehicleCatalog(makeId)
  const { rate: gelPerUsd } = useUsdGelRate()
  const listingsLoading = status === 'idle' || status === 'loading'

  useEffect(() => {
    const { sort, ...serviceFilters } = appliedFilters
    dispatch(fetchPublishedListings({ force: true, filters: toBaseListingFilters(serviceFilters, { gelPerUsd }), sort }))
  }, [appliedFilters, dispatch, gelPerUsd])

  const fuelOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === 'fuel').options, t)
  const transmissionOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === 'transmission').options, t)
  const transportOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === 'transportStatus').options, t)

  const visibleCars = useMemo(() => items.map(item => ({
    ...presentListingCard(item, t),
    displayCurrency: resultCurrency,
    gelPerUsd,
  })), [gelPerUsd, items, resultCurrency, t])

  const updateFilter = (name, value) => {
    setFilters(current => ({ ...current, [name]: value }))
  }

  const submit = event => {
    event.preventDefault()
    const nextParams = listingFiltersToSearchParams(filters)
    setResultCurrency(filters.priceCurrency)
    setAdvancedOpen(false)
    setOpenPopover('')
    setParams(nextParams, { replace: true })
  }

  const reset = () => {
    setFilters(listingFiltersFromSearchParams(new URLSearchParams()))
    setResultCurrency('usd')
    setMakeId('')
    setAdvancedOpen(false)
    setOpenPopover('')
    setParams({}, { replace: true })
  }

  const removeAppliedFilter = name => {
    const nextParams = removeListingFilterParam(params, name)
    setFilters(listingFiltersFromSearchParams(nextParams))
    if (name === 'make') setMakeId('')
    setAdvancedOpen(false)
    setOpenPopover('')
    setParams(nextParams, { replace: true })
  }

  const loadMore = () => {
    const { sort, ...serviceFilters } = appliedFilters
    dispatch(fetchPublishedListings({
      append: true,
      cursorToken,
      filters: toBaseListingFilters(serviceFilters, { gelPerUsd }),
      sort,
    }))
  }

  const priceSymbol = priceCurrencySymbol(filters.priceCurrency)
  const appliedPriceSymbol = priceCurrencySymbol(appliedFilters.priceCurrency)
  const currentMileageUnit = mileageUnitLabel(filters.mileageUnit, t)
  const appliedMileageUnit = mileageUnitLabel(appliedFilters.mileageUnit, t)
  const activeAdvancedCount = [
    appliedFilters.minYear || appliedFilters.maxYear,
    appliedFilters.minMileage || appliedFilters.maxMileage,
    appliedFilters.fuel,
    appliedFilters.transmission,
    appliedFilters.transportStatus,
    appliedFilters.sellerType,
    appliedFilters.sort !== 'newest',
  ].filter(Boolean).length

  const appliedChips = [
    appliedFilters.q && ['q', t('filters.keyword'), appliedFilters.q],
    appliedFilters.make && ['make', t('filters.make'), appliedFilters.make],
    appliedFilters.model && ['model', t('filters.model'), appliedFilters.model],
    (appliedFilters.minPrice || appliedFilters.maxPrice) && ['minPrice', t('filters.price'), `${appliedPriceSymbol}${appliedFilters.minPrice || 0} - ${appliedFilters.maxPrice ? `${appliedPriceSymbol}${appliedFilters.maxPrice}` : t('listings.maxPrice')}`],
    (appliedFilters.minYear || appliedFilters.maxYear) && ['minYear', t('filters.year'), `${appliedFilters.minYear || t('listings.minYear')} - ${appliedFilters.maxYear || t('listings.maxYear')}`],
    (appliedFilters.minMileage || appliedFilters.maxMileage) && ['minMileage', t('listing.mileage'), `${appliedFilters.minMileage || 0} - ${appliedFilters.maxMileage || t('listings.maxMileage')} ${appliedMileageUnit}`],
    appliedFilters.fuel && ['fuel', t('listing.fuel'), fuelOptions.find(option => option.value === appliedFilters.fuel)?.label || appliedFilters.fuel],
    appliedFilters.transmission && ['transmission', t('listing.transmission'), transmissionOptions.find(option => option.value === appliedFilters.transmission)?.label || appliedFilters.transmission],
    appliedFilters.transportStatus && ['transportStatus', t('listings.transportStatus'), transportOptions.find(option => option.value === appliedFilters.transportStatus)?.label || appliedFilters.transportStatus],
    appliedFilters.sellerType && ['sellerType', t('add.sellerType'), appliedFilters.sellerType === 'company' ? t('common.company') : t('common.individual')],
    appliedFilters.sort !== 'newest' && ['sort', t('listings.sort'), t(`listings.sortOptions.${appliedFilters.sort}`)],
  ].filter(Boolean)

  const yearLabel = filters.minYear || filters.maxYear
    ? `${filters.minYear || t('listings.minYear')} - ${filters.maxYear || t('listings.maxYear')}`
    : t('filters.year')
  const priceLabel = filters.minPrice || filters.maxPrice
    ? `${priceSymbol}${filters.minPrice || 0} - ${filters.maxPrice ? `${priceSymbol}${filters.maxPrice}` : t('listings.maxPrice')}`
    : t('filters.price')
  const mileageLabel = filters.minMileage || filters.maxMileage
    ? `${filters.minMileage || 0} - ${filters.maxMileage || t('listings.maxMileage')} ${currentMileageUnit}`
    : t('listing.mileage')

  return <>
    <Header />
    <main className={styles.main}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>{t('listings.eyebrow')}</span>
          <h1 className={styles.title}>{t('listings.title')}</h1>
          <p className={styles.description}>{t('listings.description')}</p>
        </div>
        <Button onClick={() => navigate('/add')} className={styles.addButton}>{t('nav.add')}</Button>
      </section>

      <form onSubmit={submit} className={styles.filters}>
        <div className={styles.filtersHeader}>
          <div className={styles.filtersTitle}><SlidersHorizontal size={18} /> {t('listings.filters')}</div>
          <button type="button" onClick={reset} className={styles.resetButton}><X size={15} /> {t('listings.reset')}</button>
        </div>
        <div className={styles.grid}>
          <FilterField label={t('filters.keyword')}>
            <input
              value={filters.q}
              onChange={event => updateFilter('q', event.target.value)}
              placeholder={t('filters.keywordPlaceholder')}
              className={styles.field}
            />
          </FilterField>
          <FilterField label={t('filters.make')}>
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
                updateFilter('model', '')
                setMakeId(option?.id ? String(option.id) : '')
              }}
            />
          </FilterField>
          <FilterField label={t('filters.model')}>
            <SearchableSelect
              value={filters.model}
              options={models}
              disabled={!makeId && !filters.make}
              loading={modelsLoading}
              placeholder={modelsLoading ? t('filters.loadingModels') : filters.make ? t('filters.allModels') : t('filters.selectMakeFirst')}
              searchPlaceholder={t('filters.searchModel')}
              emptyText={t('filters.noResults')}
              emptyOptionLabel={t('filters.allModels')}
              onChange={value => updateFilter('model', value)}
            />
          </FilterField>
          <RangeFilterPopover
            label={t('filters.price')}
            value={priceLabel}
            open={openPopover === 'price'}
            onToggle={() => setOpenPopover(openPopover === 'price' ? '' : 'price')}
            onApply={() => setOpenPopover('')}
            icon={filters.priceCurrency === 'gel' ? <span aria-hidden="true">₾</span> : <DollarSign size={18} />}
            minValue={filters.minPrice}
            maxValue={filters.maxPrice}
            minPlaceholder={t('listings.minPrice')}
            maxPlaceholder={t('listings.maxPrice')}
            onMinChange={value => updateFilter('minPrice', value)}
            onMaxChange={value => updateFilter('maxPrice', value)}
            unitOptions={priceCurrencyOptions}
            unitValue={filters.priceCurrency}
            onUnitChange={value => updateFilter('priceCurrency', value)}
          />
          <button type="button" onClick={() => setAdvancedOpen(current => !current)} className={styles.advancedToggle} aria-expanded={advancedOpen}>
            <SlidersHorizontal size={17} />
            <span>{t('listings.advanced')}</span>
            {activeAdvancedCount > 0 && <span className={styles.advancedCount}>{activeAdvancedCount}</span>}
          </button>
          <RangeFilterPopover
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
            className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)}
          />
          <div className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)}>
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
            />
          </div>
          <SelectField label={t('listing.fuel')} value={filters.fuel} options={fuelOptions} empty={t('listings.anyFuel')} onChange={value => updateFilter('fuel', value)} className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)} />
          <SelectField label={t('listing.transmission')} value={filters.transmission} options={transmissionOptions} empty={t('listings.anyTransmission')} onChange={value => updateFilter('transmission', value)} className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)} />
          <SelectField label={t('listings.transportStatus')} value={filters.transportStatus} options={transportOptions} empty={t('listings.anyStatus')} onChange={value => updateFilter('transportStatus', value)} className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)} />
          <SelectField label={t('add.sellerType')} value={filters.sellerType} options={[['individual', t('common.individual')], ['company', t('common.company')]]} empty={t('listings.anySeller')} onChange={value => updateFilter('sellerType', value)} className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)} />
          <SelectField label={t('listings.sort')} value={filters.sort} options={['newest', 'priceAsc', 'priceDesc', 'yearDesc', 'mileageAsc'].map(key => [key, t(`listings.sortOptions.${key}`)])} onChange={value => updateFilter('sort', value)} icon={<ArrowUpDown size={15} />} className={cx(styles.advancedFilter, advancedOpen && styles.advancedFilterOpen)} />
          <Button type="submit" className={styles.searchButton}><Search size={17} /> {t('common.search')}</Button>
        </div>
      </form>
      {appliedChips.length > 0 && (
        <div className={styles.activeFilters}>
          {appliedChips.map(([name, label, value]) => (
            <button key={name} type="button" onClick={() => removeAppliedFilter(name)} className={styles.filterChip}>
              <span>{label}: {value}</span>
              <X size={14} />
            </button>
          ))}
        </div>
      )}

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <div>
            <span className={styles.count}>{t('listings.shownCount', { count: visibleCars.length })}</span>
            <h2 className={styles.resultsTitle}>{t('listings.resultsTitle')}</h2>
          </div>
          {visibleCars.length > 0 && (
            <div className={styles.currencyToggle} aria-label={t('filters.price')}>
              {priceCurrencyOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setResultCurrency(option.value)}
                  aria-pressed={resultCurrency === option.value}
                  className={cx(styles.currencyButton, resultCurrency === option.value && styles.currencyButtonActive)}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className={styles.error}>{t('account.listingsError')}</p>}
        {listingsLoading ? <div className={styles.skeletonGrid} aria-label={t('home.loadingListings')}>
          {Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonBody}>
              <span className={styles.skeletonLineWide} />
              <span className={styles.skeletonLine} />
              <div className={styles.skeletonFacts}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>)}
        </div> : visibleCars.length ? (
          <>
            <div className={styles.listingsGrid}>{visibleCars.map(car => <CarCard key={car.id} car={car} />)}</div>
            {hasMore && (
              <div className={styles.loadMoreWrap}>
                <Button variant="outline" onClick={loadMore} disabled={loadingMore} className={styles.loadMoreButton}>
                  {loadingMore ? t('common.loading') : t('listings.loadMore')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.stateBox}>
            <h3 className={styles.emptyTitle}>{t('listings.emptyTitle')}</h3>
            <p className={styles.emptyText}>{t('listings.emptyText')}</p>
            <ul className={styles.emptySuggestions}>
              <li>{t('listings.emptySuggestions.year')}</li>
              <li>{t('listings.emptySuggestions.price')}</li>
              <li>{t('listings.emptySuggestions.make')}</li>
            </ul>
            <Button variant="outline" onClick={reset} className={styles.emptyAction}>{t('listings.reset')}</Button>
          </div>
        )}
      </section>
    </main>
    <Footer />
  </>
}

function FilterField({ label, children }) {
  return <div><span className={styles.label}>{label}</span>{children}</div>
}

function SelectField({ label, value, options, empty, onChange, icon, className = '' }) {
  return <label className={cx(styles.selectWrap, className)}>
    <span className={styles.label}>{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)} className={cx(styles.field, styles.select)}>
      {empty && <option value="">{empty}</option>}
      {options.map(option => {
        const value = Array.isArray(option) ? option[0] : option.value || option
        const label = Array.isArray(option) ? option[1] : option.label || option
        return <option key={value} value={value}>{label}</option>
      })}
    </select>
    <span className={styles.selectIcon}>{icon || <ChevronDown size={15} />}</span>
  </label>
}
