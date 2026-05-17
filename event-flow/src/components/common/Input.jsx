function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  error = "",
  disabled = false,
  name,
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition
          ${
            error
              ? "border-danger"
              : "border-neutral-300 focus:border-primary"
          }
          ${disabled ? "cursor-not-allowed bg-neutral-100" : "bg-white"}
        `}
      />

      {error && (
        <span className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;