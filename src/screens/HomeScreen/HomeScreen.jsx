import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock3,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Footer,
  Header,
} from "../../components";
import {
  CarCard,
  HowItWorks,
  SearchFilters,
  SectionTitle,
  TrustCard,
  trustItems,
} from "./components";
import { fetchPublishedListings } from "../../store/listingsSlice";
import { carPlaceholderImage } from "../../data/assets";
import { listingFiltersToSearchParams } from "../../utils/listingFilterParams";
import { presentListingCard } from "../../utils/listingPresenter";
import styles from "./HomeScreen.module.css";

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.listings.published);
  const [catalogFilters, setCatalogFilters] = useState({ make: "", model: "" });
  const listingsLoading = status === "idle" || status === "loading";
  const publishedCars = useMemo(
    () => items.map((item) => presentListingCard(item, t)),
    [items, t],
  );
  const filteredCars = useMemo(
    () =>
      publishedCars.filter(
        (car) =>
          (!catalogFilters.make || car.make === catalogFilters.make) &&
          (!catalogFilters.model || car.model === catalogFilters.model),
      ),
    [catalogFilters, publishedCars],
  );
  useEffect(() => {
    dispatch(fetchPublishedListings());
  }, [dispatch]);

  const searchListings = filters => {
    setCatalogFilters(filters);
    const params = listingFiltersToSearchParams(filters);
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <Header />
      <main id="home">
        <section className={styles.heroSection}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>
                <Sparkles size={14} /> {t("home.badge")}
              </span>
              <h1 className={styles.heroTitle}>
                {t("home.title")}{" "}
                <span className={styles.brandText}>
                  {t("home.titleAccent")}
                </span>
              </h1>
              <p className={styles.heroDescription}>{t("home.description")}</p>
              <div className={styles.heroActions}>
                <Button
                  onClick={() =>
                    document.querySelector("#listings").scrollIntoView()
                  }
                >
                  {t("home.viewListings")} <ArrowDownRight size={17} />
                </Button>
                <Button
                  variant="dark"
                  onClick={() => navigate("/add")}
                  className={styles.heroSecondaryButton}
                >
                  {t("nav.add")}
                </Button>
              </div>
              <div className={styles.heroBenefits}>
                <span className={styles.heroBenefit}>
                  <Check size={15} className={styles.heroBenefitIcon} />{" "}
                  {t("home.verified")}
                </span>
                <span className={styles.heroBenefit}>
                  <Check size={15} className={styles.heroBenefitIcon} />{" "}
                  {t("home.direct")}
                </span>
                <span className={styles.heroBenefit}>
                  <Check size={15} className={styles.heroBenefitIcon} />{" "}
                  {t("home.noFees")}
                </span>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <div className={styles.heroCard}>
                <div className={styles.heroImageFrame}>
                  <img
                    src={carPlaceholderImage}
                    alt={t("home.carAlt")}
                    className={styles.heroImage}
                  />
                  <div className={styles.heroImageFade} />
                  <span className={styles.heroStatus}>
                    {t("home.inTransit")}
                  </span>
                  <div className={styles.heroOverlay}>
                    <div className={styles.heroOverlayRow}>
                      <div>
                        <p className={styles.heroCompare}>
                          {t("home.compare")}
                        </p>
                        <p className={styles.heroPrice}>
                          {t("home.rightPrice")}
                        </p>
                      </div>
                      <span className={styles.heroUpdated}>
                        <Clock3 size={13} className={styles.heroUpdatedIcon} />{" "}
                        {t("home.updated")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.searchSection}>
          <SearchFilters onSearch={searchListings} />
        </section>
        <section id="listings" className={styles.listingsSection}>
          <div className={styles.sectionHeaderRow}>
            <SectionTitle
              eyebrow={t("home.latestEyebrow")}
              title={t("home.latestTitle")}
              text={t("home.latestText")}
            />
          </div>
          {listingsLoading ? (
            <div className={styles.loadingBox}>{t("home.loadingListings")}</div>
          ) : filteredCars.length ? (
            <div className={styles.listingsGrid}>
              {filteredCars.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>{t("home.emptyTitle")}</h3>
              <p className={styles.emptyText}>{t("home.emptyText")}</p>
              <Button
                onClick={() => navigate("/add")}
                className={styles.emptyAction}
              >
                {t("nav.add")}
              </Button>
            </div>
          )}
        </section>
        <section className={styles.mutedSection}>
          <div className={styles.sectionContainer}>
            <SectionTitle
              eyebrow={t("home.process")}
              title={t("home.howTitle")}
              text={t("home.howText")}
              center
            />
            <HowItWorks />
          </div>
        </section>
        <section className={styles.brandSection}>
          <div className={styles.brandGrid}>
            <div>
              <SectionTitle
                eyebrow={t("brandIdea.eyebrow")}
                title={t("brandIdea.title")}
                text={t("brandIdea.text")}
              />
              <p className={styles.brandMission}>{t("brandIdea.mission")}</p>
            </div>
            <div className={styles.priceCard}>
              <p className={styles.priceCardLabel}>
                {t("brandIdea.sameClass")}
              </p>
              <div className={styles.marketBox}>
                <div className={styles.priceRow}>
                  <span className={styles.marketLabel}>
                    {t("brandIdea.localMarket")}
                  </span>
                  <span className={styles.priceStrong}>$20,900</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.marketProgress} />
                </div>
              </div>
              <div className={styles.offerBox}>
                <span className={styles.offerBadge}>
                  {t("brandIdea.smartOffer")}
                </span>
                <div className={styles.priceRow}>
                  <span className={styles.offerLabel}>
                    {t("brandIdea.inTransit")}
                  </span>
                  <span className={styles.offerPrice}>$16,400</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.offerProgress} />
                </div>
              </div>
              <div className={styles.savingsRow}>
                <span className={styles.savingsLabel}>
                  {t("brandIdea.saving")}
                </span>
                <span className={styles.savingsValue}>$4,500 • 22%</span>
              </div>
            </div>
            <p className={styles.disclaimer}>{t("brandIdea.disclaimer")}</p>
          </div>
        </section>
        <section className={styles.mutedSection}>
          <div className={styles.sectionContainer}>
            <SectionTitle
              eyebrow={t("trust.eyebrow")}
              title={t("trust.title")}
              center
            />
            <div className={styles.trustGrid}>
              {trustItems.map(([icon, title, text]) => (
                <TrustCard
                  key={title}
                  icon={icon}
                  title={t(title)}
                  text={t(text)}
                />
              ))}
            </div>
          </div>
        </section>
        <section id="companies" className={styles.companiesSection}>
          <div className={styles.companiesCard}>
            <div className={styles.companiesGlow} />
            <div className={styles.companiesContent}>
              <span className={styles.companiesEyebrow}>
                {t("companies.eyebrow")}
              </span>
              <h2 className={styles.companiesTitle}>{t("companies.title")}</h2>
              <p className={styles.companiesText}>{t("companies.text")}</p>
              <Button className={styles.companiesAction}>
                {t("companies.cta")} <ArrowRight size={17} />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
