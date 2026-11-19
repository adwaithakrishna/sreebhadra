import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import BookingDrawer from './BookingDrawer';
import { formatRange, routeText } from '../lib/format';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled'];

export default function Bookings() {
  const { data, error, loading, reload, setData } = useAsync(api.admin.bookings, []);
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const openId = params.get('open');
  const selected = (data || []).find((b) => b.id === openId) || null;

  const counts = useMemo(() => (data || []).reduce((a, b) => ({ ...a, [b.status]: (a[b.status] || 0) + 1 }), { all: (data || []).length }), [data]);
  const rows = (data || []).filter((b) => (filter === 'all' || b.status === filter) && (!q || `${b.customer.name} ${b.reference} ${b.customer.email} ${routeText(b)}`.toLowerCase().includes(q.toLowerCase())));
  const open = (id) => setParams(id ? { open: id } : {}, { replace: true });
  const onChanged = (updated) => setData((list) => list.map((b) => (b.id === updated.id ? updated : b)));

  return (
    <div>
      <h1 className="text-4xl font-extrabold">Bookings</h1>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold capitalize transition ${filter === f ? 'border-forest bg-forest text-ivory' : 'border-forest/30 text-forest hover:border-forest'}`}>
              {f} <span className="opacity-70">({counts[f] || 0})</span>
            </button>
          ))}
        </div>
        <div className="lg:w-72">
          <label htmlFor="bk-search" className="sr-only">Search bookings</label>
          <input id="bk-search" type="search" className="field" placeholder="Search name, reference, route…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        {loading && <Spinner label="Loading bookings…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && rows.length === 0 && <EmptyState title={data.length ? 'No bookings match' : 'No bookings yet'}>{data.length ? 'Try a different status or search.' : 'New requests from the booking form will appear here.'}</EmptyState>}

        {rows.length > 0 && (
          <>
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <caption className="sr-only">Bookings</caption>
                <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-charcoal/70">
                  <tr>{['Customer', 'Route', 'Travel dates', 'Pax', 'Vehicle', 'Status', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h || <span className="sr-only">Actions</span>}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-sage-100/50">
                      <td className="px-4 py-3"><p className="font-bold">{b.customer.name}</p><p className="text-xs text-charcoal/70">{b.reference}</p></td>
                      <td className="max-w-[240px] px-4 py-3"><p className="truncate" title={routeText(b)}>{routeText(b)}</p></td>
                      <td className="whitespace-nowrap px-4 py-3">{formatRange(b.startDate, b.endDate)}</td>
                      <td className="px-4 py-3">{b.passengers}</td>
                      <td className="px-4 py-3">{b.vehicle?.name || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => open(b.id)} className="rounded-full px-4 py-1.5 font-bold text-forest underline underline-offset-4 hover:bg-forest/10" aria-label={`View booking ${b.reference} for ${b.customer.name}`}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-3 md:hidden">
              {rows.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => open(b.id)} className="card block w-full p-5 text-left">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{b.customer.name}</p><p className="text-xs text-charcoal/70">{b.reference}</p></div><StatusBadge status={b.status} /></div>
                    <p className="mt-2 text-sm">{formatRange(b.startDate, b.endDate)} · {b.passengers} pax</p>
                    <p className="text-sm text-charcoal/80">{b.vehicle?.name || '—'}</p>
                    <p className="mt-1 truncate text-sm text-charcoal/70">{routeText(b)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BookingDrawer booking={selected} onClose={() => open(null)} onChanged={onChanged} />
    </div>
  );
}
