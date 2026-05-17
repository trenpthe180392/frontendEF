function Textarea({
  value,
  onChange,
  placeholder = "",
  rows = 4,
  error = "",
  name,
}) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition resize-none
          ${
            error
              ? "border-danger"
              : "border-neutral-300 focus:border-primary"
          }
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

export default Textarea;