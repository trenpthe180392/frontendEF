import clsx from "clsx";

const variants = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  default: "bg-neutral-100 text-neutral-700",
};

function Badge({
  children,
  variant = "default",
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

export default Badge;