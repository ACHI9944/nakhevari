import { Building2, Phone, UserRound } from 'lucide-react'
import { DatePicker } from '../../../../components/DatePicker/DatePicker'
import { SearchableSelect } from '../../../../components/SearchableSelect/SearchableSelect'
import styles from './AuthRegisterFields.module.css'

export function AuthRegisterFields({
  accountType,
  birthDate,
  gender,
  onAccountTypeChange,
  onBirthDateChange,
  onGenderChange,
  t,
}) {
  return (
    <>
      <div className={styles.twoColumnGrid}>
        <label>
          <span className={styles.label}>{t('auth.firstName')}</span>
          <input name="firstName" className={styles.field} placeholder={t('auth.firstName')} required />
        </label>
        <label>
          <span className={styles.label}>{t('auth.lastName')}</span>
          <input name="lastName" className={styles.field} placeholder={t('auth.lastName')} required />
        </label>
        {accountType === 'individual' && <div>
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
        </div>}
        {accountType === 'individual' && <div>
          <span className={styles.label}>{t('auth.birthDate')}</span>
          <DatePicker name="birthDate" value={birthDate} onChange={onBirthDateChange} placeholder={t('auth.birthDate')} />
        </div>}
      </div>
      <label>
        <span className={styles.label}>{t('auth.phoneNumber')}</span>
        <div className={styles.inputWrap}>
          <Phone size={17} className={styles.inputIcon} />
          <input type="tel" name="phone" className={styles.iconInput} placeholder="+995 5XX XX XX XX" required />
        </div>
        <span className={styles.phoneHint}>{t('auth.phoneHint')}</span>
      </label>
      <div>
        <span className={styles.label}>{t('auth.accountType')}</span>
        <div className={styles.accountTypeGrid}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="accountType"
              value="individual"
              checked={accountType === 'individual'}
              onChange={() => onAccountTypeChange('individual')}
              className={styles.radioInput}
            />
            <span className={styles.radioCard}>
              <UserRound size={16} /> {t('common.individual')}
            </span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="accountType"
              value="company"
              checked={accountType === 'company'}
              onChange={() => onAccountTypeChange('company')}
              className={styles.radioInput}
            />
            <span className={styles.radioCard}>
              <Building2 size={16} /> {t('common.company')}
            </span>
          </label>
        </div>
      </div>
      {accountType === 'company' && <div className={styles.twoColumnGrid}>
        <label>
          <span className={styles.label}>{t('profileCompletion.companyName')}</span>
          <input name="companyName" className={styles.field} required />
        </label>
        <label>
          <span className={styles.label}>{t('profileCompletion.identificationNumber')}</span>
          <input name="identificationNumber" className={styles.field} inputMode="numeric" required />
        </label>
      </div>}
    </>
  )
}
