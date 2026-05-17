function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  error = "",
  name,
}) {
  return (
    <div className="flex flex-col gap-1">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition
          ${
            error
              ? "border-danger"
              : "border-neutral-300 focus:border-primary"
          }
        `}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export default Select;