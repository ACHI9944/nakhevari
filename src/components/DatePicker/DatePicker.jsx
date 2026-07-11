import { cx } from '../../utils/classNames'
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { enUS, ka } from "@daypicker/react/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./DatePicker.module.css";

const toDate = (value) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DatePicker({
  name,
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  initialMonth,
}) {
  const { i18n } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const today = new Date();
  const firstDate = minDate || new Date(1900, 0);
  const lastDate = maxDate || today;
  const locale = i18n.resolvedLanguage?.startsWith("ka") ? ka : enUS;
  const formatted = selected?.toLocaleDateString(
    i18n.resolvedLanguage?.startsWith("ka") ? "ka-GE" : "en-US",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cx(styles.trigger, open && styles.triggerOpen)}
      >
        <CalendarDays size={18} className={styles.icon} />
        <span
          className={cx(styles.value, formatted && styles.valueSelected)}
        >
          {formatted || placeholder}
        </span>
        <span
          className={cx(styles.chevron, open && styles.chevronOpen)}
        >
          <ChevronDown size={17} />
        </span>
      </button>
      {open && (
        <div className={styles.popover}>
          <DayPicker
            animate
            mode="single"
            locale={locale}
            selected={selected}
            defaultMonth={
              selected ||
              initialMonth ||
              new Date(today.getFullYear() - 25, today.getMonth())
            }
            onSelect={(date) => {
              if (date) {
                onChange(toValue(date));
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            startMonth={firstDate}
            endMonth={lastDate}
            disabled={[{ before: firstDate }, { after: lastDate }]}
            reverseYears
            className={styles.calendar}
          />
        </div>
      )}
    </div>
  );
}
