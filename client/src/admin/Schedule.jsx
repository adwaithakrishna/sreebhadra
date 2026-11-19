import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import BookingDrawer from './BookingDrawer';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';
import { MONTH_NAMES, formatRange, toISO, todayISO } from '../lib/format';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const chip = { pending: 'border-2 border-dashed border-sun bg-sun-100 text-[#4F3200]', confirmed: 'bg-forest text-ivory', completed: 'bg-sage-200 text-forest' };

export default function Schedule() {
  const { data, error, loading, reload, setData } = useAsync(api.admin.bookings, []);
  const vehicles = useAsync(api.admin.vehicles, []);
  const now = new Date();
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [vehicle, setVehicle] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [dayList, setDayList] = useState(null);

  const active = useMemo(() => (data || []).filter((b) => ['pending', 'confirmed', 'completed'].includes(b.status) && (!vehicle || b.vehicle?.id === vehicle)), [data, vehicle]);
  const first = new Date(Date.UTC(cur.y, cur.m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(cur.y, cur.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => toISO(cur.y, cur.m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const monthStart = toISO(cur.y, cur.m, 1);
  const monthEnd = toISO(cur.y, cur.m, count);
  const forDay = (iso) => active.filter((b) => b.startDate <= iso && b.endDate >= iso);
  const inMonth = active.filter((b) => b.startDate <= monthEnd && b.endDate >= monthStart).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const shift = (n) => setCur(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const today = todayISO();
  const selected = (data || []).find((b) => b.id === selectedId) || null;

  const BtnChip = ({ b }) => (
    <button type="button" onClick={() => { setDayList(null); setSelectedId(b.id); }} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-bold ${chip[b.status]}`} title={`${b.customer.name} · ${b.vehicle?.name} · ${b.status}`}>
      {b.vehicle?.name?.split(' ')[0]} · {b.customer.name}
    </button>
  );

  return (
    <div>
      <h1 className="text-4xl font-extrabold">Schedule</h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-forest/30 text-forest hover:border-forest"><IconChevronLeft /></button>
          <p className="min-w-44 text-center font-display text-2xl font-bold" aria-live="polite">{MONTH_NAMES[cur.m]} {cur.y}</p>
          <button type="button" onClick={() => shift(1)} aria-label="Next month" className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-forest/30 text-forest hover:border-forest"><IconChevronRight /></button>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="sch-v" className="sr-only">Filter by vehicle</label>
          <select id="sch-v" className="field" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">All vehicles</option>
            {(vehicles.data || []).map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
        <li className="flex items-center gap-2"><span className="h-4 w-6 rounded bg-forest" />Confirmed</li>
        <li className="flex items-center gap-2"><span className="h-4 w-6 rounded border-2 border-dashed border-sun bg-sun-100" />Pending (dates not held)</li>
        <li className="flex items-center gap-2"><span className="h-4 w-6 rounded bg-sage-200" />Completed</li>
      </ul>

      <div className="mt-5">
        {loading && <Spinner label="Loading schedule…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          <>
            <div className="card hidden overflow-hidden md:block">
              <div className="grid grid-cols-7 border-b border-forest/10 bg-sage-100 text-center text-xs font-bold uppercase tracking-wider text-forest">{DOW.map((d) => <div key={d} className="py-2">{d}</div>)}</div>
              <div className="grid grid-cols-7">
                {cells.map((iso, i) => {
                  const list = iso ? forDay(iso) : [];
                  return (
                    <div key={i} className={`min-h-28 space-y-1 border-b border-r border-forest/10 p-1.5 ${iso ? '' : 'bg-ivory-200/60'} ${iso === today ? 'bg-sun-100/60' : ''}`}>
                      {iso && <p className={`text-xs font-bold ${iso === today ? 'text-forest' : 'text-charcoal/60'}`}>{Number(iso.slice(8))}</p>}
                      {list.slice(0, 3).map((b) => <BtnChip key={b.id} b={b} />)}
                      {list.length > 3 && <button type="button" onClick={() => setDayList(iso)} className="text-xs font-bold text-forest underline">+{list.length - 3} more</button>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="md:hidden">
              {inMonth.length === 0 ? <EmptyState title="Nothing scheduled">No bookings in {MONTH_NAMES[cur.m]}.</EmptyState> : (
                <ul className="space-y-3">
                  {inMonth.map((b) => (
                    <li key={b.id}><button type="button" onClick={() => setSelectedId(b.id)} className="card block w-full p-4 text-left">
                      <div className="flex items-start justify-between gap-3"><p className="font-bold">{formatRange(b.startDate, b.endDate)}</p><StatusBadge status={b.status} /></div>
                      <p className="text-sm">{b.vehicle?.name} · {b.customer.name}</p>
                    </button></li>
                  ))}
                </ul>
              )}
            </div>
            {inMonth.length === 0 && <p className="mt-4 hidden text-sm text-charcoal/70 md:block">No bookings in {MONTH_NAMES[cur.m]} {cur.y}{vehicle ? ' for this vehicle' : ''}.</p>}
          </>
        )}
      </div>

      <Modal open={!!dayList} onClose={() => setDayList(null)} title={dayList ? `Bookings on ${dayList}` : ''} size="md">
        <ul className="space-y-2 p-5">{dayList && forDay(dayList).map((b) => <li key={b.id}><BtnChip b={b} /></li>)}</ul>
      </Modal>
      <BookingDrawer booking={selected} onClose={() => setSelectedId(null)} onChanged={(u) => setData((l) => l.map((b) => (b.id === u.id ? u : b)))} />
    </div>
  );
}
