// Status is conveyed by label + icon + colour, never colour alone.
const STYLES = {
  pending: { label: 'Pending', cls: 'bg-sun-100 text-[#6B4300] ring-sun', icon: '◔' },
  confirmed: { label: 'Confirmed', cls: 'bg-forest text-ivory ring-forest', icon: '✓' },
  unavailable: { label: 'Unavailable', cls: 'bg-red-50 text-red-800 ring-red-300', icon: '✕' },
  available: { label: 'Available', cls: 'bg-sage-100 text-forest ring-sage', icon: '✓' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-800 ring-red-300', icon: '✕' },
  cancelled: { label: 'Cancelled', cls: 'bg-charcoal/10 text-charcoal ring-charcoal/30', icon: '–' },
  completed: { label: 'Completed', cls: 'bg-sage-200 text-forest ring-sage', icon: '★' },
  maintenance: { label: 'Maintenance', cls: 'bg-sun-100 text-[#6B4300] ring-sun', icon: '⚙' },
  hidden: { label: 'Hidden', cls: 'bg-charcoal/10 text-charcoal ring-charcoal/30', icon: '–' },
};

export default function StatusBadge({ status, className = '' }) {
  const s = STYLES[status] || { label: status, cls: 'bg-charcoal/10 text-charcoal ring-charcoal/30', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${s.cls} ${className}`}>
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}
export const STATUS_STYLES = STYLES;
