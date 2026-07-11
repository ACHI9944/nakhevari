import { cx } from '../../utils/classNames'
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Fuel,
  Gauge,
  MessageCircle,
  Phone,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Footer, Header } from "../../components";
import { useUsdGelRate } from "../../hooks/useUsdGelRate";
import { fetchListing } from "../../store/listingsSlice";
import {
  normalizePriceCurrency,
  priceCurrencyOptions,
} from "../../utils/listingFilterUnits";
import { presentListingDetail } from "../../utils/listingPresenter";
import styles from "./ListingDetailScreen.module.css";

export function ListingDetail() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const listing = useSelector(state => state.listings.details.byId[id]);
  const [selectedImage, setSelectedImage] = useState('');
  const status = useSelector(state => state.listings.details.statusById[id] || 'idle');
  const car = useMemo(() => listing ? presentListingDetail(listing, t) : null, [listing, t]);
  const currency = normalizePriceCurrency(searchParams.get('currency'));
  const { rate: gelPerUsd } = useUsdGelRate();
  const loading = status === 'idle' || status === 'loading';
  const error = status === 'failed' ? t('listing.loadError') : t('listing.notFound');
  const activeImage = car?.images.includes(selectedImage) ? selectedImage : car?.images[0];
  const safeGelPerUsd = Number.isFinite(Number(gelPerUsd)) && Number(gelPerUsd) > 0 ? Number(gelPerUsd) : 1;
  const currencySymbol = currency === 'gel' ? '₾' : '$';
  const priceValue = car ? (currency === 'gel' ? Math.round(car.price * safeGelPerUsd) : car.price) : 0;
  const marketValue = car ? (currency === 'gel' ? Math.round(car.market * safeGelPerUsd) : car.market) : 0;
  const savingValue = Math.max(marketValue - priceValue, 0);
  const formatMoney = value => `${currencySymbol}${Number(value || 0).toLocaleString()}`;
  const setCurrency = nextCurrency => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextCurrency === 'gel') nextParams.set('currency', 'gel');
    else nextParams.delete('currency');
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    dispatch(fetchListing(id));
  }, [dispatch, id]);

  if (loading || !car) {
    return <><Header /><main className={styles.stateMain}><div><h1 className={styles.stateTitle}>{loading ? t('common.loading') : error}</h1>{!loading && <Button onClick={() => navigate("/#listings")} className={styles.stateButton}>{t('listing.back')}</Button>}</div></main><Footer /></>;
  }
  return (
    <>
      <Header />
      <main className={cx(styles.container, styles.main)}>
        <button
          onClick={() => navigate("/#listings")}
          className={styles.backButton}
        >
          <ArrowLeft size={17} /> {t('listing.back')}
        </button>
        <div className={styles.layout}>
          <div>
            <div className={styles.heroImageWrap}>
              <img
                src={activeImage}
                alt={car.title}
                className={styles.heroImage}
              />
              <span className={styles.statusBadge}>
                {t('listing.inTransit')}
              </span>
              {car.images.length > 1 && <span className={styles.imageCounter}>
                {car.images.indexOf(activeImage) + 1} / {car.images.length}
              </span>}
            </div>
            {car.images.length > 1 && <div className={styles.thumbs}>
              {car.images.map((image, index) => <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                aria-label={t('add.photoPreview', { number: index + 1 })}
                aria-pressed={image === activeImage}
                className={cx(styles.thumb, image === activeImage && styles.thumbActive)}
              >
                <img src={image} alt="" className={styles.thumbImage} />
              </button>)}
            </div>}
          </div>
          <aside>
            <div className={styles.card}>
              <div className={styles.summaryTop}>
                <span className={styles.savingBadge}>
                  {car.saving} {t('listing.compared')}
                </span>
                <span className={styles.idText}>ID: {id.slice(0, 8)}</span>
              </div>
              <h1 className={styles.title}>
                {car.title}
              </h1>
              <p className={styles.price}>
                {formatMoney(priceValue)}
              </p>
              <p className={styles.market}>
                {t('listing.market')} ≈{" "}
                <span className={styles.lineThrough}>
                  {formatMoney(marketValue)}
                </span>
              </p>
              <div className={styles.currencyToggle} aria-label={t('filters.price')}>
                {priceCurrencyOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCurrency(option.value)}
                    aria-pressed={currency === option.value}
                    className={cx(styles.currencyButton, currency === option.value && styles.currencyButtonActive)}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
              <div className={styles.facts}>
                {[
                  [CalendarDays, t('listing.year'), car.year], [Gauge, t('listing.mileage'), car.mileage], [Fuel, t('listing.fuel'), car.fuel], [Zap, t('listing.transmission'), car.transmission], [Clock3, t('listing.arrival'), car.eta], [Route, t('listing.route'), car.location],
                ].map(([Icon, l, v]) => (
                  <div key={l}>
                    <span className={styles.factLabel}>
                      <Icon size={13} />
                      {l}
                    </span>
                    <b className={styles.factValue}>{v}</b>
                  </div>
                ))}
              </div>
              <div className={styles.vinBox}>
                <span className={styles.vinLabel}>{t('listing.vin')}</span>
                <div className={styles.vinRow}>
                  <b className={styles.vinText}>{car.vin || t('listing.missing')}</b>
                  <ShieldCheck size={18} className={styles.successIcon} />
                </div>
              </div>
            </div>
            <div className={cx(styles.card, styles.sellerCard)}>
              <div className={styles.sellerHeader}>
                <span className={styles.sellerIcon}>
                  <UserRound size={20} />
                </span>
                <div>
                  <b className={styles.sellerName}>{car.sellerDisplayName}</b>
                  {car.isVerifiedCompany && (
                    <span className={styles.verified}>
                      <BadgeCheck size={13} /> {t('listing.verifiedCompany')}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.contactGrid}>
                <Button href={car.phoneHref} disabled={!car.phoneHref} className={styles.wideButton}>
                  <Phone size={16} /> {t('listing.call')}
                </Button>
                <Button href={car.whatsappHref} disabled={!car.whatsappHref} variant="outline">
                  <MessageCircle size={16} /> WhatsApp
                </Button>
              </div>
            </div>
          </aside>
        </div>
        <section className={styles.descriptionSection}>
          <div>
            <h2 className={styles.descriptionTitle}>{t('listing.description')}</h2>
            <p className={styles.descriptionText}>
              {car.damageDescription || t('listing.defaultDescription')}
            </p>
          </div>
          <div className={styles.smartPrice}>
            <Sparkles className={styles.smartIcon} />
            <h3 className={styles.smartTitle}>{t('listing.smartPrice')}</h3>
            <p className={styles.smartText}>
              {t('listing.saving', { amount: formatMoney(savingValue) })}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
