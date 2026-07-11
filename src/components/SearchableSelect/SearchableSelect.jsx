import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import styles from "./SearchableSelect.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function SearchableSelect({
  name,
  value = "",
  options = [],
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  emptyOptionLabel,
  disabled = false,
  loading = false,
  searchable = true,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option,
      ),
    [options],
  );
  const selected = normalizedOptions.find((option) => option.value === value);
  const filteredOptions = normalizedOptions.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const choose = (option) => {
    onChange?.(option?.value || "", option || null);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={styles.root}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cx(styles.trigger, open && styles.triggerOpen)}
      >
        <span
          className={cx(styles.value, selected && styles.valueSelected)}
        >
          {loading ? placeholder : selected?.label || placeholder}
        </span>
        <span
          className={cx(styles.chevron, open && styles.chevronOpen)}
        >
          <ChevronDown size={17} />
        </span>
      </button>

      {open && (
        <div className={styles.menu}>
          {searchable && (
            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <Search
                  size={17}
                  className={styles.searchIcon}
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                    if (event.key === "Enter" && filteredOptions[0]) {
                      event.preventDefault();
                      choose(filteredOptions[0]);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className={styles.searchInput}
                />
              </div>
            </div>
          )}
          <div role="listbox" className={styles.list}>
            {emptyOptionLabel && !query && (
              <button
                type="button"
                onClick={() => choose(null)}
                className={styles.emptyOption}
              >
                {emptyOptionLabel}
              </button>
            )}
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => choose(option)}
                className={cx(styles.option, option.value === value && styles.optionSelected)}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={16} />}
              </button>
            ))}
            {!filteredOptions.length && (
              <p className={styles.emptyText}>
                {emptyText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
