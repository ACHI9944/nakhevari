import styles from "./Button.module.css";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function Button({
  children,
  variant = "primary",
  className = "",
  href,
  onClick,
  type = "button",
  disabled = false,
  ...props
}) {
  const variantClass =
    variant === "primary"
      ? styles.primary
      : variant === "dark"
        ? styles.dark
        : styles.outline;

  const classes = cx(styles.button, variantClass, className)

  if (href && !disabled) {
    return (
      <a href={href} onClick={onClick} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
