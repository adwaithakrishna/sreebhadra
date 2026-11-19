/** Labelled form control with accessible error + hint wiring. `as` = input | textarea | select. */
export default function Field({ id, label, error, hint, required, as: Tag = 'input', className = '', children, ...rest }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-forest">
        {label}
        {required ? <span className="text-red-700" aria-hidden="true"> *</span> : <span className="font-normal text-charcoal/60"> (optional)</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <Tag
        id={id}
        className={`field ${error ? 'field-error' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        {...rest}
      >
        {children}
      </Tag>
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-charcoal/70">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1.5 flex gap-1.5 text-sm font-medium text-red-800"><span aria-hidden="true">⚠</span>{error}</p>}
    </div>
  );
}
