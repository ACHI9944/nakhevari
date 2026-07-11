import styles from "./SectionTitle.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function SectionTitle({ eyebrow, title, text, center = false }) {
  return (
    <div className={cx(styles.sectionTitle, center && styles.center)}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <h2 className={styles.heading}>{title}</h2>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
