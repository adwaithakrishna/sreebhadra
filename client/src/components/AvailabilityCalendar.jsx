import { useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from './Icons';
import { MONTH_NAMES, formatDate, parseISO, toISO, todayISO } from '../lib/format';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Month calendar for picking a date range. Fully occupied days are disabled; partial days
 * stay selectable because trip start/end times can leave room for another booking.
 */
export default function AvailabilityCalendar({ busy = [], start, end, onChange, minDate = todayISO() }) {
  const seed = start ? parseISO(start) : new Date();
  const [cursor, setCursor] = useState({ y: seed.getUTCFullYear(), m: seed.getUTCMonth() });

  const busyDays = useMemo(() => {
    const full = new Set();
    const partial = new Set();
    busy.forEach(({ startDate, startTime = '00:00', endDate, endTime = '23:59' }) => {
      for (let t = parseISO(startDate).getTime(); t <= parseISO(endDate).getTime(); t += 86400000) {
        const day = new Date(t).toISOString().slice(0, 10);
        const fullDay = (day !== startDate || startTime <= '00:00') && (day !== endDate || endTime >= '23:59');
        if (fullDay) full.add(day);
        else partial.add(day);
      }
    });
    return { full, partial };
  }, [busy]);

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const count = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const shift = (n) => setCursor(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });

  const pick = (iso) => {
    if (!start || (start && end)) onChange(iso, '');
    else if (iso < start) onChange(iso, '');
    else onChange(start, iso);
  };

  return (
    <div className="rounded-2xl border border-forest/15 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/10"><IconChevronLeft /></button>
        <p className="font-display text-lg font-bold text-forest" aria-live="polite">{MONTH_NAMES[cursor.m]} {cursor.y}</p>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/10"><IconChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-charcoal/60" aria-hidden="true">
        {DOW.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso = toISO(cursor.y, cursor.m, day);
          const isBusy = busyDays.full.has(iso);
          const isPartial = busyDays.partial.has(iso);
          const past = iso < minDate;
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = start && end && iso > start && iso < end;
          const disabled = isBusy || past;
          let cls = 'text-forest hover:bg-sun/30';
          if (inRange) cls = 'bg-sun-100 text-forest rounded-none';
          if (isStart || isEnd) cls = 'bg-forest text-ivory';
          if (past) cls = 'text-charcoal/35';
          if (isBusy) cls = 'bg-red-50 text-red-800/80 line-through decoration-2';
          else if (isPartial) cls = 'bg-amber-100 text-forest ring-1 ring-inset ring-amber-300';
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              aria-pressed={isStart || isEnd || undefined}
              aria-label={`${formatDate(iso)}${isBusy ? ', fully booked' : isPartial ? ', partial booking, times checked' : past ? ', unavailable (past)' : ''}${isStart ? ', start date' : ''}${isEnd ? ', end date' : ''}`}
              className={`aspect-square rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed ${cls}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-charcoal/80">
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-forest" />Your dates</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-red-100 ring-1 ring-red-300" />Booked (confirmed)</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-amber-100 ring-1 ring-amber-300" />Part-day booking - times checked</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-white ring-1 ring-charcoal/30" />Open - not held until we confirm</li>
      </ul>
    </div>
  );
}
