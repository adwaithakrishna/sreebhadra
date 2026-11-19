import { EmptyState, ErrorState, Spinner } from '../components/States';
import { api } from '../lib/api';
import { formatRange } from '../lib/format';
import { useAsync } from '../hooks/useAsync';

export default function Feedback() {
  const { data, error, loading, reload } = useAsync(api.admin.feedback, []);
  return (
    <div>
      <h1 className="text-4xl font-extrabold">Customer feedback</h1>
      <p className="mt-2 text-charcoal/75">Ratings and comments customers sent after completed trips.</p>
      {loading && <Spinner label="Loading customer feedback…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data?.length === 0 && <EmptyState title="No feedback yet">Customer feedback will appear here after a completed trip.</EmptyState>}
      <ul className="mt-6 space-y-4">
        {(data || []).map((item) => (
          <li key={item.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold">{item.booking?.vehicle || 'Vehicle'} · {item.booking?.customer || 'Customer'}</p>
                {item.booking && <p className="mt-1 text-sm text-charcoal/70">{item.booking.reference} · {formatRange(item.booking.startDate, item.booking.endDate)}</p>}
              </div>
              <p className="rounded-full bg-sun/50 px-3 py-1 font-bold text-forest" aria-label={`${item.rating} out of 5 stars`}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} <span className="text-sm">{item.rating}/5</span></p>
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">{item.comment}</p>
            <p className="mt-3 text-xs text-charcoal/60">Received {new Date(item.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
