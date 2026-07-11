import { BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./TrustCard.module.css";

export function TrustCard({ icon: Icon, title, text }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>
        <Icon size={21} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.text}>{text}</p>
    </div>
  );
}

export const trustItems = [
  [ShieldCheck, "trust.vinTitle", "trust.vinText"],
  [BadgeCheck, "trust.verifiedTitle", "trust.verifiedText"],
  [Building2, "trust.allTitle", "trust.allText"],
  [Sparkles, "trust.earlyTitle", "trust.earlyText"],
];
