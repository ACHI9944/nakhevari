import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronDown, DollarSign, Gauge, Search, SlidersHorizontal, X } from "lucide-react";
import { useVehicleCatalog } from "../../../../hooks/useVehicleCatalog";
import { Button, RangeFilterPopover } from "../../../../components";
import { SearchableSelect } from "../../../../components/SearchableSelect/SearchableSelect";
import { formGroups, localizeVehicleOptions } from "../../../../data/listingForm";
import { listingFilterDefaults } from "../../../../utils/listingFilterParams";
import {
  mileageUnitLabel,
  mileageUnitOptions,
  priceCurrencyOptions,
  priceCurrencySymbol,
} from "../../../../utils/listingFilterUnits";
import styles from "./SearchFilters.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function SearchFilters({ onSearch }) {
  const { t } = useTranslation();
  const [makeId, setMakeId] = useState("");
  const [q, setQ] = useState(listingFilterDefaults.q);
  const [make, setMake] = useState(listingFilterDefaults.make);
  const [model, setModel] = useState(listingFilterDefaults.model);
  const [transportStatus, setTransportStatus] = useState(listingFilterDefaults.transportStatus);
  const [minYear, setMinYear] = useState(listingFilterDefaults.minYear);
  const [maxYear, setMaxYear] = useState(listingFilterDefaults.maxYear);
  const [minPrice, setMinPrice] = useState(listingFilterDefaults.minPrice);
  const [maxPrice, setMaxPrice] = useState(listingFilterDefaults.maxPrice);
  const [priceCurrency, setPriceCurrency] = useState(listingFilterDefaults.priceCurrency);
  const [minMileage, setMinMileage] = useState(listingFilterDefaults.minMileage);
  const [maxMileage, setMaxMileage] = useState(listingFilterDefaults.maxMileage);
  const [mileageUnit, setMileageUnit] = useState(listingFilterDefaults.mileageUnit);
  const [fuel, setFuel] = useState(listingFilterDefaults.fuel);
  const [transmission, setTransmission] = useState(listingFilterDefaults.transmission);
  const [sellerType, setSellerType] = useState(listingFilterDefaults.sellerType);
  const [openPopover, setOpenPopover] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { makes, models, makesLoading, modelsLoading } = useVehicleCatalog(makeId);
  const fuelOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === "fuel").options, t);
  const transmissionOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === "transmission").options, t);
  const transportOptions = localizeVehicleOptions(formGroups[1][1].find(field => field.name === "transportStatus").options, t);

  const yearLabel = minYear || maxYear
    ? `${minYear || t("listings.minYear")} — ${maxYear || t("listings.maxYear")}`
    : t("filters.year");
  const priceSymbol = priceCurrencySymbol(priceCurrency);
  const priceLabel = minPrice || maxPrice
    ? `${priceSymbol}${minPrice || 0} — ${maxPrice ? `${priceSymbol}${maxPrice}` : t("listings.maxPrice")}`
    : t("filters.price");
  const currentMileageUnit = mileageUnitLabel(mileageUnit, t);
  const mileageLabel = minMileage || maxMileage
    ? `${minMileage || 0} — ${maxMileage || t("listings.maxMileage")} ${currentMileageUnit}`
    : t("listing.mileage");

  const submit = (event) => {
    event.preventDefault();
    onSearch?.({
      q,
      make,
      model,
      transportStatus,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      priceCurrency,
      minMileage,
      maxMileage,
      mileageUnit,
      fuel,
      transmission,
      sellerType,
    });
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.title}>
        <Search size={18} className={styles.icon} />
        <span className={styles.titleText}>{t("filters.title")}</span>
      </div>
      <div className={styles.grid}>
        <label className={cx(styles.label, styles.keywordField)}>
          <span className={styles.labelText}>{t("filters.keyword")}</span>
          <input
            value={q}
            onChange={event => setQ(event.target.value)}
            placeholder={t("filters.keywordPlaceholder")}
            className={styles.field}
          />
        </label>
        <div>
          <span className={styles.labelText}>{t("filters.make")}</span>
          <SearchableSelect
            value={make}
            options={makes.map((item) => ({ value: item.name, label: item.name, id: item.id }))}
            loading={makesLoading}
            placeholder={makesLoading ? t("filters.loadingMakes") : t("filters.allMakes")}
            searchPlaceholder={t("filters.searchMake")}
            emptyText={t("filters.noResults")}
            emptyOptionLabel={t("filters.allMakes")}
            onChange={(value, option) => {
              setMake(value);
              setMakeId(option?.id ? String(option.id) : "");
              setModel("");
            }}
          />
        </div>
        <div>
          <span className={styles.labelText}>{t("filters.model")}</span>
          <SearchableSelect
            value={model}
            options={models}
            disabled={!makeId}
            loading={modelsLoading}
            placeholder={
              modelsLoading
                ? t("filters.loadingModels")
                : makeId
                  ? t("filters.allModels")
                  : t("filters.selectMakeFirst")
            }
            searchPlaceholder={t("filters.searchModel")}
            emptyText={t("filters.noResults")}
            emptyOptionLabel={t("filters.allModels")}
            onChange={setModel}
          />
        </div>
        <RangeFilterPopover
          name="year"
          label={t("filters.year")}
          value={yearLabel}
          open={openPopover === "year"}
          onToggle={() => setOpenPopover(openPopover === "year" ? "" : "year")}
          onApply={() => setOpenPopover("")}
          icon={<CalendarDays size={18} />}
          minValue={minYear}
          maxValue={maxYear}
          minPlaceholder={t("listings.minYear")}
          maxPlaceholder={t("listings.maxYear")}
          onMinChange={setMinYear}
          onMaxChange={setMaxYear}
          size="large"
        />
        <RangeFilterPopover
          name="price"
          label={t("filters.price")}
          value={priceLabel}
          open={openPopover === "price"}
          onToggle={() => setOpenPopover(openPopover === "price" ? "" : "price")}
          onApply={() => setOpenPopover("")}
          icon={priceCurrency === "gel" ? <span aria-hidden="true">₾</span> : <DollarSign size={19} />}
          minValue={minPrice}
          maxValue={maxPrice}
          minPlaceholder={t("listings.minPrice")}
          maxPlaceholder={t("listings.maxPrice")}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
          unitOptions={priceCurrencyOptions}
          unitValue={priceCurrency}
          onUnitChange={setPriceCurrency}
          size="large"
        />
        <button type="button" onClick={() => setAdvancedOpen(true)} className={styles.advancedButton}>
          <span className={styles.advancedIcon}><SlidersHorizontal size={17} /></span>
          <span className={styles.advancedText}>{t("listings.advanced")}</span>
        </button>
        <Button type="submit" className={styles.submit}>
          {t("common.search")}
        </Button>
      </div>
      {advancedOpen && <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setAdvancedOpen(false)}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="advanced-filters-title" onMouseDown={event => event.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 id="advanced-filters-title" className={styles.modalTitle}>{t("listings.advanced")}</h2>
            <button type="button" onClick={() => setAdvancedOpen(false)} className={styles.closeButton} aria-label={t("common.back")}><X size={22} /></button>
          </div>
          <div className={styles.modalBody}>
            <section>
              <h3 className={styles.modalSectionTitle}>{t("listings.vehicleInfo")}</h3>
              <div className={styles.modalGrid}>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t("listing.fuel")}</span>
                  <select value={fuel} onChange={event => setFuel(event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t("listings.anyFuel")}</option>
                    {fuelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t("listing.transmission")}</span>
                  <select value={transmission} onChange={event => setTransmission(event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t("listings.anyTransmission")}</option>
                    {transmissionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <RangeFilterPopover
                  label={t("listing.mileage")}
                  value={mileageLabel}
                  open={openPopover === "mileage"}
                  onToggle={() => setOpenPopover(openPopover === "mileage" ? "" : "mileage")}
                  onApply={() => setOpenPopover("")}
                  icon={<Gauge size={18} />}
                  minValue={minMileage}
                  maxValue={maxMileage}
                  minPlaceholder={t("listings.minMileage")}
                  maxPlaceholder={t("listings.maxMileage")}
                  onMinChange={setMinMileage}
                  onMaxChange={setMaxMileage}
                  unitOptions={mileageUnitOptions}
                  unitValue={mileageUnit}
                  onUnitChange={setMileageUnit}
                  size="large"
                />
                <label className={styles.label}>
                  <span className={styles.labelText}>{t("add.sellerType")}</span>
                  <select value={sellerType} onChange={event => setSellerType(event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t("listings.anySeller")}</option>
                    <option value="individual">{t("common.individual")}</option>
                    <option value="company">{t("common.company")}</option>
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
                <label className={styles.label}>
                  <span className={styles.labelText}>{t("listings.transportStatus")}</span>
                  <select value={transportStatus} onChange={event => setTransportStatus(event.target.value)} className={cx(styles.field, styles.select)}>
                    <option value="">{t("listings.anyStatus")}</option>
                    {transportOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={15} className={styles.selectIcon} />
                </label>
              </div>
            </section>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={() => {
              setFuel(listingFilterDefaults.fuel);
              setTransmission(listingFilterDefaults.transmission);
              setMinMileage(listingFilterDefaults.minMileage);
              setMaxMileage(listingFilterDefaults.maxMileage);
              setMileageUnit(listingFilterDefaults.mileageUnit);
              setSellerType(listingFilterDefaults.sellerType);
              setTransportStatus(listingFilterDefaults.transportStatus);
            }} className={styles.clearButton}>{t("listings.reset")}</button>
            <Button type="button" onClick={() => setAdvancedOpen(false)} className={styles.modalApply}>{t("listings.apply")}</Button>
          </div>
        </section>
      </div>}
    </form>
  );
}
