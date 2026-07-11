import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BadgeCheck, CalendarDays, Clock3, Fuel, Gauge, Zap } from "lucide-react";
import { Button } from "../../../../components";
import styles from "./CarCard.module.css";

const Fact = ({ icon: Icon, children }) => (
  <span className={styles.fact}>
    <Icon size={14} />
    {children}
  </span>
);

export function CarCard({ car }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const priceCurrency = car.displayCurrency === "gel" ? "gel" : "usd";
  const gelPerUsd = Number.isFinite(Number(car.gelPerUsd)) && Number(car.gelPerUsd) > 0 ? Number(car.gelPerUsd) : 1;
  const priceValue = priceCurrency === "gel" ? Math.round(car.price * gelPerUsd) : car.price;
  const marketValue = priceCurrency === "gel" ? Math.round(car.market * gelPerUsd) : car.market;
  const priceSymbol = priceCurrency === "gel" ? "₾" : "$";
  const detailPath = `/listing/${car.id}${priceCurrency === "gel" ? "?currency=gel" : ""}`;

  return (
    <article className={styles.card}>
      <button onClick={() => navigate(detailPath)} className={styles.imageButton}>
        <img src={car.image} alt={car.title} className={styles.image} />
        <span className={styles.status}>{car.transportStatus || t("home.inTransit")}</span>
        <span className={styles.saving}>{car.saving}</span>
      </button>
      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.title}>{car.title}</h3>
          <p className={styles.price}>{priceSymbol}{priceValue.toLocaleString()}</p>
        </div>
        <p className={styles.marketPrice}>
          {t("filters.price")} ≈ {priceSymbol}{marketValue.toLocaleString()}
        </p>
        <div className={styles.factsGrid}>
          <Fact icon={CalendarDays}>{car.year}</Fact>
          <Fact icon={Gauge}>{car.mileage}</Fact>
          <Fact icon={Fuel}>{car.fuel}</Fact>
          <Fact icon={Zap}>{car.transmission}</Fact>
        </div>
        <div className={styles.meta}>
          <span className={styles.location}>{car.location}</span>
          <span className={styles.eta}>
            <Clock3 size={14} /> {car.eta}
          </span>
        </div>
        <div className={styles.sellerRow}>
          <span className={styles.sellerName}>{car.sellerDisplayName}</span>
          {car.isVerifiedCompany ? (
            <span className={styles.verified}>
              <BadgeCheck size={13} /> {t("listing.verifiedCompany")}
            </span>
          ) : (
            <span className={styles.sellerType}>{car.sellerTypeLabel}</span>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate(detailPath)} className={styles.fullWidth}>
          {t("common.details")} <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  );
}
