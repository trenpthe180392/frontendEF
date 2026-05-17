function Card({ title, children, footer }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">
          {title}
        </h3>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;