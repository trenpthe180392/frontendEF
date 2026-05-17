import clsx from "clsx";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-light shadow-btn",
  secondary:
    "bg-secondary text-white hover:opacity-90",
  ghost:
    "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
  danger:
    "bg-danger text-white hover:opacity-90",
};

function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-lg px-4 py-2 text-sm font-medium transition duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export default Button;