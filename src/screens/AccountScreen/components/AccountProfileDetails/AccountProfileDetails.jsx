import { BadgeCheck, Building2, Check, Mail, Phone, UserRound, X } from 'lucide-react'
import { Button } from '../../../../components'
import { DatePicker } from '../../../../components/DatePicker/DatePicker'
import { SearchableSelect } from '../../../../components/SearchableSelect/SearchableSelect'
import styles from './AccountProfileDetails.module.css'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export function AccountProfileDetails({
  accountType,
  birthDate,
  companyStatus,
  editing,
  formError,
  gender,
  onAccountTypeChange,
  onBirthDateChange,
  onCancel,
  onGenderChange,
  onSubmit,
  profile,
  saving,
  t,
  user,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.profileTitle}>{t('account.profileTitle')}</h2>
          <p className={styles.profileSub}>{t('account.profileSubtitle')}</p>
        </div>
        {editing && (
          <button type="button" onClick={onCancel} className={styles.iconButton} aria-label={t('common.back')}>
            <X size={17} />
          </button>
        )}
      </div>

      {!editing ? (
        <ProfileRows
          companyStatus={companyStatus}
          profile={profile}
          t={t}
          user={user}
        />
      ) : (
        <ProfileForm
          accountType={accountType}
          birthDate={birthDate}
          formError={formError}
          gender={gender}
          onAccountTypeChange={onAccountTypeChange}
          onBirthDateChange={onBirthDateChange}
          onCancel={onCancel}
          onGenderChange={onGenderChange}
          onSubmit={onSubmit}
          profile={profile}
          saving={saving}
          t={t}
        />
      )}
    </div>
  )
}

function ProfileRows({ companyStatus, profile, t, user }) {
  const companyStatusClass = companyStatus === 'verified'
    ? styles.statusVerified
    : companyStatus === 'rejected'
      ? styles.statusRejected
      : styles.statusPending

  return (
    <div className={styles.profileRows}>
      <div className={styles.profileRow}>
        <Mail size={17} className={styles.rowIcon} />
        <span className={styles.truncate}>{user.email}</span>
        {user.emailVerified && <BadgeCheck size={17} className={styles.successIcon} />}
      </div>
      <div className={styles.profileRow}>
        <Phone size={17} className={styles.rowIcon} />
        <span>{profile?.phone || t('listing.missing')}</span>
      </div>
      <div className={styles.profileRow}>
        <Building2 size={17} className={styles.rowIcon} />
        <span>{profile?.accountType === 'company' ? t('common.company') : t('common.individual')}</span>
      </div>
      {profile?.accountType === 'company' && (
        <div className={styles.companyBox}>
          <div className={styles.companyRow}>
            <div>
              <p className={styles.companyLabel}>{t('account.company')}</p>
              <p className={styles.companyName}>{profile.companyName || t('listing.missing')}</p>
              <p className={styles.companyId}>{profile.identificationNumber || t('listing.missing')}</p>
            </div>
            <span className={cx(styles.badge, companyStatusClass)}>{t(`account.companyStatus.${companyStatus}`)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileForm({
  accountType,
  birthDate,
  formError,
  gender,
  onAccountTypeChange,
  onBirthDateChange,
  onCancel,
  onGenderChange,
  onSubmit,
  profile,
  saving,
  t,
}) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <label>
          <span className={styles.label}>{t('auth.firstName')}</span>
          <input name="firstName" className={styles.field} defaultValue={profile?.firstName || ''} required />
        </label>
        <label>
          <span className={styles.label}>{t('auth.lastName')}</span>
          <input name="lastName" className={styles.field} defaultValue={profile?.lastName || ''} required />
        </label>
      </div>
      <label className={styles.blockLabel}>
        <span className={styles.label}>{t('auth.phoneNumber')}</span>
        <input type="tel" name="phone" className={styles.field} defaultValue={profile?.phone || ''} placeholder="+995 5XX XX XX XX" required />
      </label>
      <div>
        <span className={styles.label}>{t('auth.accountType')}</span>
        <div className={styles.radioGrid}>
          {[
            ['individual', UserRound, t('common.individual')],
            ['company', Building2, t('common.company')],
          ].map(([value, Icon, label]) => (
            <label key={value} className={styles.radioLabel}>
              <input
                type="radio"
                name="accountType"
                value={value}
                checked={accountType === value}
                onChange={() => onAccountTypeChange(value)}
                className={styles.radioInput}
              />
              <span className={styles.radioCard}><Icon size={16} /> {label}</span>
            </label>
          ))}
        </div>
      </div>
      {accountType === 'individual' ? (
        <div className={styles.formGrid}>
          <div>
            <span className={styles.label}>{t('auth.gender')}</span>
            <SearchableSelect
              name="gender"
              value={gender}
              onChange={onGenderChange}
              searchable={false}
              placeholder={t('common.select')}
              options={[
                { value: 'male', label: t('auth.male') },
                { value: 'female', label: t('auth.female') },
                { value: 'other', label: t('auth.otherGender') },
              ]}
            />
          </div>
          <div>
            <span className={styles.label}>{t('auth.birthDate')}</span>
            <DatePicker name="birthDate" value={birthDate} onChange={onBirthDateChange} placeholder={t('auth.birthDate')} />
          </div>
        </div>
      ) : (
        <div className={styles.formGrid}>
          <label>
            <span className={styles.label}>{t('profileCompletion.companyName')}</span>
            <input name="companyName" className={styles.field} defaultValue={profile?.companyName || ''} required />
          </label>
          <label>
            <span className={styles.label}>{t('profileCompletion.identificationNumber')}</span>
            <input name="identificationNumber" className={styles.field} defaultValue={profile?.identificationNumber || ''} inputMode="numeric" required />
          </label>
        </div>
      )}
      {formError && <p className={styles.error}>{formError}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>
          {saving ? t('profileCompletion.saving') : t('account.saveProfile')} <Check size={17} />
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>{t('account.cancel')}</Button>
      </div>
    </form>
  )
}
