function Checkbox({
  checked,
  onChange,
  label,
  name,
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
      />
      {label}
    </label>
  );
}

export default Checkbox;