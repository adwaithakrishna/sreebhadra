import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { formatRange, routeText } from '../lib/format';

function Stat({ label, value, tone = 'bg-white', hint }) {
  return (
    <div className={`card p-6 ${tone}`}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-5xl font-extrabold text-forest">{value}</p>
      {hint && <p className="mt-1 text-sm text-charcoal/70">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const stats = useAsync(api.admin.stats, []);
  const list = useAsync(api.admin.bookings, []);
  const pending = (list.data || []).filter((b) => b.status === 'pending').slice(0, 5);

  return (
    <div>
      <h1 className="text-4xl font-extrabold">Dashboard</h1>
      <div className="mt-6">
        {stats.loading && <Spinner label="Loading summary…" />}
        {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} />}
        {stats.data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total bookings" value={stats.data.total} />
            <Stat label="Pending requests" value={stats.data.pending} tone="!bg-sun-100" hint="Need a decision" />
            <Stat label="Confirmed" value={stats.data.confirmed} />
            <Stat label="Upcoming journeys" value={stats.data.upcoming} hint="Confirmed, not yet finished" />
          </div>
        )}
      </div>

      <section className="mt-10" aria-labelledby="pend-h">
        <div className="flex items-center justify-between gap-4">
          <h2 id="pend-h" className="text-2xl font-bold">Awaiting your decision</h2>
          <Button to="/admin/bookings" variant="outline" size="sm">All bookings</Button>
        </div>
        <div className="mt-4">
          {list.loading && <Spinner label="Loading requests…" />}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {list.data && pending.length === 0 && <EmptyState title="All caught up">There are no pending requests right now.</EmptyState>}
          <ul className="space-y-3">
            {pending.map((b) => (
              <li key={b.id}>
                <Link to={`/admin/bookings?open=${b.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5">
                  <div className="min-w-0">
                    <p className="font-bold">{b.customer.name} <span className="font-normal text-charcoal/70">· {b.vehicle?.name || 'Vehicle removed'}</span></p>
                    <p className="truncate text-sm text-charcoal/80">{routeText(b)}</p>
                    <p className="text-sm text-charcoal/80">{formatRange(b.startDate, b.endDate)}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
