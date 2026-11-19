import Button from './Button';
import { IconAlert } from './Icons';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-forest">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-forest/30 border-t-forest" aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-forest/20 bg-white/60 px-6 py-14 text-center">
      <p className="font-display text-2xl font-bold text-forest">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-charcoal/80">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We couldn’t load this' }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 px-6 py-10 text-center">
      <IconAlert size={32} className="mx-auto text-red-700" />
      <p className="mt-3 font-display text-2xl font-bold text-red-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-red-900/90">{error?.message || 'Please try again.'}</p>
      {onRetry && <Button variant="dark" size="sm" className="mt-5" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = 'info', title, children, className = '' }) {
  const tones = {
    info: 'border-sage bg-sage-100 text-forest',
    warn: 'border-sun bg-sun-100 text-[#4F3200]',
    error: 'border-red-300 bg-red-50 text-red-900',
    success: 'border-forest/30 bg-sage-100 text-forest',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]} ${className}`}>
      {title && <p className="font-bold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
