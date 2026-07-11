import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Upload } from "lucide-react";
import { Button, Footer, Header } from "../../components";
import { useAuth } from "../../store/useAuth";
import { formGroups } from "../../data/listingForm";
import { createListing } from "../../services/listings/listingService";
import { useVehicleCatalog } from "../../hooks/useVehicleCatalog";
import { ConditionSection, ContactSection, VehicleFormSections } from "./components";
import { useListingPhotos } from "./hooks/useListingPhotos";
import styles from "./AddListingScreen.module.css";

export function AddListing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [makeId, setMakeId] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [selectValues, setSelectValues] = useState({});
  const [arrivalDate, setArrivalDate] = useState("");
  const today = new Date();
  const firstArrivalDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastArrivalDate = new Date(today.getFullYear() + 3, 11, 31);
  const { makes, models, makesLoading, modelsLoading } = useVehicleCatalog(makeId);
  const sellerType = profile?.accountType === 'company' && profile.companyVerificationStatus === 'verified'
    ? 'company'
    : profile?.accountType === 'individual'
      ? 'individual'
      : '';
  const { addPhotos, maxPhotos, photoInput, photos, removePhoto } = useListingPhotos({
    onError: () => setError(t('add.photoError')),
    onValid: () => setError(''),
  });

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const requiredSelects = formGroups.flatMap(([, fields]) => fields.filter(field => field.type === 'select').map(field => field.name));
    if (!sellerType) {
      setError(t('add.companyVerificationRequired'));
      return;
    }
    if (!vehicleMake || !vehicleModel || !arrivalDate || requiredSelects.some(name => !form.get(name))) {
      setError(t('filters.requiredFields'));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (!photos.length) {
        setError(t('add.photoRequired'));
        setSaving(false);
        return;
      }
      await createListing(
        Object.fromEntries(form.entries()),
        user,
        photos.map(photo => photo.file),
        profile,
      );
      navigate("/account", { replace: true });
    } catch (error) {
      console.error('add-listing: failed to save listing', error);
      setError(t('add.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const changeMake = (value, option) => {
    setVehicleMake(value);
    setMakeId(option?.id ? String(option.id) : '');
    setVehicleModel('');
  };

  const changeSelect = (name, value) => {
    setSelectValues(current => ({ ...current, [name]: value }));
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <button
            onClick={() => navigate("/")}
            className={styles.backButton}
          >
            <ArrowLeft size={17} /> {t('add.back')}
          </button>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>{t('add.eyebrow')}</span>
            <h1 className={styles.title}>{t('add.title')}</h1>
            <p className={styles.description}>{t('add.description')}</p>
          </div>
          <form onSubmit={submit} className={styles.form}>
            <VehicleFormSections
              arrivalDate={arrivalDate}
              firstArrivalDate={firstArrivalDate}
              lastArrivalDate={lastArrivalDate}
              makeId={makeId}
              makes={makes}
              makesLoading={makesLoading}
              models={models}
              modelsLoading={modelsLoading}
              onArrivalDateChange={setArrivalDate}
              onMakeChange={changeMake}
              onModelChange={setVehicleModel}
              onSelectChange={changeSelect}
              selectValues={selectValues}
              t={t}
              vehicleMake={vehicleMake}
              vehicleModel={vehicleModel}
            />
            <ConditionSection
              addPhotos={addPhotos}
              maxPhotos={maxPhotos}
              photoInput={photoInput}
              photos={photos}
              removePhoto={removePhoto}
              t={t}
            />
            <ContactSection sellerType={sellerType} t={t} />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={saving} className={styles.submit}>
              <Upload size={17} /> {saving ? t('add.saving') : t('add.submit')}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
