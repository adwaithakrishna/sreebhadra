import { useState } from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { Notice } from '../components/States';
import { api, ApiError } from '../lib/api';
import { formatDateTime, formatRange, formatTime, daysBetween } from '../lib/format';

const ACTIONS = {
  pending: [
    { to: 'confirmed', label: 'Confirm booking', variant: 'primary' },
    { to: 'rejected', label: 'Reject', variant: 'outline', ask: 'Reject this request? The customer will need to be told.' },
    { to: 'cancelled', label: 'Cancel', variant: 'outline', ask: 'Cancel this request?' },
  ],
  confirmed: [
    { to: 'completed', label: 'Mark completed', variant: 'dark' },
    { to: 'cancelled', label: 'Cancel booking', variant: 'outline', ask: 'Cancel this confirmed booking? Its dates will become available again.' },
  ],
};

const Row = ({ k, children }) => (
  <div className="grid gap-1 py-3 sm:grid-cols-[130px_1fr] sm:gap-4"><dt className="eyebrow pt-0.5">{k}</dt><dd className="font-medium">{children}</dd></div>
);

export default function BookingDrawer({ booking, onClose, onChanged }) {
  const [busy, setBusy] = useState('');
  const [ask, setAsk] = useState(null);
  const [error, setError] = useState(null);
  if (!booking) return null;
  const actions = ACTIONS[booking.status] || [];

  async function run(action) {
    setBusy(action.to); setError(null); setAsk(null);
    try {
      onChanged(await api.admin.setStatus(booking.id, action.to));
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, err.message));
    } finally {
      setBusy('');
    }
  }

  return (
    <Modal open onClose={onClose} variant="drawer" title={`Booking ${booking.reference}`}>
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={booking.status} /><span className="text-sm text-charcoal/70">Requested {formatDateTime(booking.createdAt)}</span></div>

        {error && (
          <Notice tone="error" title={error.status === 409 && error.data.conflicts ? 'Can’t confirm - dates conflict' : 'Action failed'} className="mt-4">
            <p>{error.message}</p>
            {error.data.conflicts?.length > 0 && <p className="mt-1">Already confirmed: <strong>{error.data.conflicts.map((c) => formatRange(c.startDate, c.endDate)).join(', ')}</strong></p>}
          </Notice>
        )}

        {actions.length > 0 && (
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button key={a.to} variant={a.variant} size="sm" loading={busy === a.to} disabled={!!busy} onClick={() => (a.ask ? setAsk(a) : run(a))}>{a.label}</Button>
              ))}
            </div>
            {ask && (
              <div role="alertdialog" aria-label="Confirm action" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-900">{ask.ask}</p>
                <div className="mt-3 flex gap-2"><Button variant="danger" size="sm" onClick={() => run(ask)} data-autofocus>Yes, {ask.label.toLowerCase()}</Button><Button variant="ghost" size="sm" onClick={() => setAsk(null)}>Keep as is</Button></div>
              </div>
            )}
          </div>
        )}
        {actions.length === 0 && <p className="mt-4 text-sm text-charcoal/70">This booking is {booking.status}; no further actions are available.</p>}

        <dl className="mt-6 divide-y divide-forest/10 rounded-2xl bg-white px-5">
          <Row k="Customer">{booking.customer.name}</Row>
          <Row k="Phone"><a className="underline underline-offset-2" href={`tel:${booking.customer.phone.replace(/[^\d+]/g, '')}`}>{booking.customer.phone}</a></Row>
          <Row k="Email"><a className="break-all underline underline-offset-2" href={`mailto:${booking.customer.email}`}>{booking.customer.email}</a></Row>
          <Row k="Vehicle">{booking.vehicle ? `${booking.vehicle.name} (seats ${booking.vehicle.capacity})` : 'Vehicle removed'}</Row>
          <Row k="Dates">{formatRange(booking.startDate, booking.endDate)} <span className="font-normal text-charcoal/70">· {daysBetween(booking.startDate, booking.endDate)} day(s)</span></Row>
          <Row k="Start time">{formatTime(booking.startTime)}</Row>
          <Row k="Passengers">{booking.passengers}</Row>
          <Row k="Route">
            <ol className="space-y-1">
              <li><span className="text-charcoal/60">From:</span> {booking.startLocation}</li>
              {booking.stops.map((s, i) => <li key={i}><span className="text-charcoal/60">Stop {i + 1}:</span> {s}</li>)}
            </ol>
          </Row>
          <Row k="Notes">{booking.notes || <span className="font-normal text-charcoal/60">None</span>}</Row>
        </dl>

        <h3 className="mt-8 text-lg font-bold">History</h3>
        <ol className="mt-2 space-y-2 text-sm">
          {booking.statusHistory.map((h, i) => <li key={i} className="flex flex-wrap items-center gap-2"><StatusBadge status={h.status} /><span className="text-charcoal/75">{formatDateTime(h.at)} · {h.by}</span></li>)}
        </ol>
      </div>
    </Modal>
  );
}
