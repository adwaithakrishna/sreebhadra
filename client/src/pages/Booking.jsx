import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Field from '../components/Field';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import VehicleMedia from '../components/VehicleMedia';
import { Notice, Spinner, ErrorState } from '../components/States';
import { IconPlus, IconTrash } from '../components/Icons';
import { api, ApiError } from '../lib/api';
import { validateBooking } from '../lib/validation';
import { formatDate, formatRange, formatTime, routeText, todayISO } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const EMPTY = {
  vehicle: '', startLocation: '', stops: [''], startDate: '', endDate: '', startTime: '09:00',
  passengers: '2', name: '', phone: '', email: '', notes: '',
};

const Section = ({ n, title, children }) => (
  <fieldset className="card p-6 sm:p-8">
    <legend className="sr-only">{title}</legend>
    <div className="mb-6 flex items-center gap-3" aria-hidden="true">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-forest font-display font-bold text-sun">{n}</span>
      <h2 className="text-2xl font-extrabold">{title}</h2>
    </div>
    <div className="space-y-5">{children}</div>
  </fieldset>
);

/** Plain-language availability result. "pending" never appears here: nothing is held until an admin confirms. */
function AvailabilityPanel({ state, vehicle }) {
  if (!vehicle) return <Notice>Choose a vehicle and dates to check availability.</Notice>;
  if (state.status === 'idle') return <Notice>Pick your travel dates to check whether {vehicle.name} is free.</Notice>;
  if (state.status === 'checking') return <Notice><span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-forest/40 border-t-forest" aria-hidden="true" />Checking {vehicle.name} for your whole date range…</span></Notice>;
  if (state.status === 'error') return <Notice tone="warn" title="Couldn’t check availability">{state.message} You can still send the request - we’ll verify it when we review it.</Notice>;
  if (state.status === 'unavailable')
    return (
      <Notice tone="error" title="Unavailable for these dates">
        <p className="mt-1">
          {state.reason === 'vehicle_unavailable'
            ? `${vehicle.name} can’t be booked right now.`
            : `${vehicle.name} already has a confirmed booking on ${state.conflicts.map((c) => formatRange(c.startDate, c.endDate)).join(' and ')}.`}{' '}
          Please change your dates or choose another vehicle.
        </p>
      </Notice>
    );
  return (
    <Notice tone="success" title="These dates are currently open">
      <p className="mt-1">Sending the form creates a <StatusBadge status="pending" className="mx-1 align-middle" /> request. Dates are <strong>not held</strong> until our team confirms them.</p>
    </Notice>
  );
}

function TripFeedback({ booking, phone, onSubmitted }) {
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [state, setState] = useState({ busy: false, error: '', sent: false });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: '', sent: false });
    try {
      await api.submitFeedback({ reference: booking.reference, phone, rating: Number(rating), comment });
      setState({ busy: false, error: '', sent: true });
      onSubmitted();
    } catch (err) {
      setState({ busy: false, error: err.message, sent: false });
    }
  }
  if (booking.feedbackSubmitted || state.sent) return <Notice tone="success" className="mt-4">Thanks for sharing your feedback about this trip.</Notice>;
  if (booking.feedbackEligible) return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl bg-sage-100 p-4" aria-label={`Feedback for trip ${booking.reference}`}>
      <h3 className="text-lg font-bold">How was your trip?</h3>
      <Field id={`feedback-rating-${booking.reference}`} as="select" label="Rating" required value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Okay</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option>
      </Field>
      <Field id={`feedback-comment-${booking.reference}`} as="textarea" rows={3} label="Your feedback" required minLength={3} maxLength={2000} placeholder="Tell us about your trip." value={comment} onChange={(e) => setComment(e.target.value)} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" variant="dark" loading={state.busy} disabled={comment.trim().length < 3}>Send feedback</Button>
    </form>
  );
  if (booking.status === 'completed') return <p className="mt-3 text-sm text-charcoal/70">You can share feedback once the trip end date arrives.</p>;
  return null;
}

function TrackRequest() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState({ status: 'idle' });
  async function lookup(e) {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      setState({ status: 'done', bookings: await api.bookingHistory(phone.trim()) });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }
  return (
    <section className="container-x pb-24" aria-labelledby="track-h">
      <div className="rounded-[2rem] bg-sage-100 p-6 sm:p-10">
        <h2 id="track-h" className="text-3xl font-extrabold">Find your bookings</h2>
        <p className="mt-2 max-w-xl text-charcoal/85">Enter the phone number you used when booking to see your booking history.</p>
        <form onSubmit={lookup} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field id="t-phone" type="tel" inputMode="tel" label="Phone number used for booking" required placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <Button type="submit" variant="dark" loading={state.status === 'loading'} disabled={!phone.trim()}>Find bookings</Button>
        </form>
        <p className="mt-2 text-xs text-charcoal/65">Use your own number. Anyone with access to that number can view its trip summaries.</p>
        <div className="mt-5" aria-live="polite">
          {state.status === 'error' && <Notice tone="error">{state.message}</Notice>}
          {state.status === 'done' && (
            state.bookings.length === 0
              ? <Notice>No bookings were found for that phone number. Use the same number you entered when booking.</Notice>
              : <div className="space-y-3">{state.bookings.map((booking) => <div key={booking.reference} className="card p-5">
                  <div className="flex flex-wrap items-center gap-3"><StatusBadge status={booking.status} /><span className="font-bold">{booking.reference}</span></div>
                  <p className="mt-3">{booking.vehicle} · {formatRange(booking.startDate, booking.endDate)} · {routeText(booking)}</p>
                  <p className="mt-2 text-sm text-charcoal/80">{{ pending: 'Awaiting confirmation from our team. Dates are not held yet.', confirmed: 'Confirmed - your vehicle is reserved.', rejected: 'We couldn’t accommodate this request. Please try other dates or vehicle.', cancelled: 'This booking was cancelled.', completed: 'This journey is complete. Thank you for travelling with us.' }[booking.status]}</p>
                  <TripFeedback booking={booking} phone={phone.trim()} onSubmitted={() => setState((current) => ({ ...current, bookings: current.bookings.map((item) => item.reference === booking.reference ? { ...item, feedbackSubmitted: true } : item) }))} />
                </div>)}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Booking() {
  useDocumentTitle('Book your journey');
  const [params] = useSearchParams();
  const { data: vehicles, error: vErr, loading: vLoading, reload } = useAsync(api.vehicles, []);
  const [v, setV] = useState({ ...EMPTY, vehicle: params.get('vehicle') || '' });
  const [touched, setTouched] = useState({});
  const [serverErr, setServerErr] = useState({});
  const [submit, setSubmit] = useState({ status: 'idle', message: '' });
  const [avail, setAvail] = useState({ status: 'idle', conflicts: [] });
  const [busy, setBusy] = useState([]);
  const [done, setDone] = useState(null);
  const summary = useRef(null);

  const vehicle = useMemo(() => (vehicles || []).find((x) => x._id === v.vehicle) || null, [vehicles, v.vehicle]);
  // If a ?vehicle= id isn't in the public list, drop it.
  useEffect(() => { if (vehicles && v.vehicle && !vehicle) setV((p) => ({ ...p, vehicle: '' })); }, [vehicles]); // eslint-disable-line

  const errors = { ...validateBooking(v, vehicle), ...serverErr };
  const show = (k) => ((touched[k] || touched.all) && errors[k]) || undefined;
  const set = (k) => (e) => { const val = e.target.value; setV((p) => ({ ...p, [k]: val })); setServerErr((p) => ({ ...p, [k]: undefined })); };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const setDates = (startDate, endDate) => { setV((p) => ({ ...p, startDate, endDate })); setServerErr((p) => ({ ...p, startDate: undefined, endDate: undefined })); };

  // Busy ranges for the calendar.
  useEffect(() => {
    setBusy([]);
    if (!v.vehicle) return;
    let live = true;
    api.busy(v.vehicle).then((b) => live && setBusy(b)).catch(() => {});
    return () => { live = false; };
  }, [v.vehicle]);

  // Debounced availability check for the ENTIRE selected range.
  const datesOk = v.vehicle && v.startDate && v.endDate && !errors.startDate && !errors.endDate;
  useEffect(() => {
    if (!datesOk) { setAvail({ status: 'idle', conflicts: [] }); return; }
    setAvail({ status: 'checking', conflicts: [] });
    let live = true;
    const t = setTimeout(() => {
      api.availability(v.vehicle, v.startDate, v.endDate)
        .then((r) => live && setAvail(r.available ? { status: 'available', conflicts: [] } : { status: 'unavailable', conflicts: r.conflicts || [], reason: r.reason }))
        .catch((e) => live && setAvail({ status: 'error', conflicts: [], message: e.message }));
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [datesOk, v.vehicle, v.startDate, v.endDate]);

  const setStop = (i, val) => setV((p) => ({ ...p, stops: p.stops.map((s, j) => (j === i ? val : s)) }));
  const addStop = () => setV((p) => (p.stops.length < 15 ? { ...p, stops: [...p.stops, ''] } : p));
  const removeStop = (i) => setV((p) => ({ ...p, stops: p.stops.filter((_, j) => j !== i) }));

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ all: true });
    const local = validateBooking(v, vehicle);
    if (Object.keys(local).length) {
      setSubmit({ status: 'error', message: 'Please fix the highlighted fields.' });
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    if (avail.status === 'unavailable') return;
    setSubmit({ status: 'sending', message: '' });
    try {
      const r = await api.createBooking({ ...v, passengers: Number(v.passengers), stops: v.stops.map((s) => s.trim()).filter(Boolean) });
      setDone(r.booking);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAvail({ status: 'unavailable', conflicts: err.data.conflicts || [] });
        setSubmit({ status: 'error', message: 'Someone else’s confirmed booking now overlaps these dates. Please choose different dates or another vehicle.' });
      } else {
        setServerErr(err.fieldErrors || {});
        setSubmit({ status: 'error', message: err.message });
      }
    }
  }

  if (done) {
    return (
      <>
        <PageHero eyebrow="Request received" title="Thank you - we’re on it." />
        <section className="container-x pb-24">
          <div ref={summary} className="card mx-auto max-w-3xl p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3"><StatusBadge status="pending" /><span className="font-display text-3xl font-extrabold">{done.reference}</span></div>
            <Notice tone="warn" title="Your booking is NOT confirmed yet" className="mt-5">Our team will check availability and contact you by phone or email. Keep your reference - you can check its status on this page at any time.</Notice>
            <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[['Vehicle', done.vehicle], ['Dates', formatRange(done.startDate, done.endDate)], ['Start time', formatTime(done.startTime)], ['Passengers', done.passengers], ['Route', routeText(done)]].map(([k, val]) => (
                <div key={k} className={k === 'Route' ? 'sm:col-span-2' : ''}><dt className="eyebrow">{k}</dt><dd className="mt-1 text-lg font-medium">{val}</dd></div>
              ))}
            </dl>
            <Button variant="outline" className="mt-8" onClick={() => { setDone(null); setV({ ...EMPTY }); setTouched({}); setSubmit({ status: 'idle', message: '' }); }}>Make another request</Button>
          </div>
        </section>
      </>
    );
  }

  const blocked = avail.status === 'unavailable';
  return (
    <>
      <PageHero eyebrow="Booking" title="Book your journey.">Tell us where you’re going and when. We’ll check the full date range against our confirmed bookings, then confirm with you personally.</PageHero>
      <section className="container-x pb-16">
        {vLoading && <Spinner label="Loading vehicles…" />}
        {vErr && <ErrorState error={vErr} onRetry={reload} title="We can’t take bookings right now" />}
        {vehicles && vehicles.length === 0 && <ErrorState error={{ message: 'No vehicles are open for booking at the moment. Please contact us.' }} title="No vehicles available" />}
        {vehicles && vehicles.length > 0 && (
          <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <div className="space-y-8">
              <Section n="1" title="Your route">
                <Field id="b-start" label="Starting place" required autoComplete="off" placeholder="e.g. Hotel, airport, address or town" value={v.startLocation} onChange={set('startLocation')} onBlur={blur('startLocation')} error={show('startLocation')} />
                <div>
                  <p className="mb-1.5 text-sm font-bold text-forest" id="stops-label">Destination(s) / places to visit <span className="text-red-700" aria-hidden="true">*</span><span className="sr-only"> (required)</span></p>
                  <ul className="space-y-3" aria-labelledby="stops-label">
                    {v.stops.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <input aria-label={`Stop ${i + 1}`} className={`field ${show('stops') && i === 0 ? 'field-error' : ''}`} placeholder={i === 0 ? 'First destination' : `Stop ${i + 1}`} value={s} onChange={(e) => { setStop(i, e.target.value); setServerErr((p) => ({ ...p, stops: undefined })); }} onBlur={blur('stops')} aria-invalid={show('stops') && i === 0 ? 'true' : undefined} aria-describedby={show('stops') ? 'stops-err' : undefined} />
                        {v.stops.length > 1 && <button type="button" onClick={() => removeStop(i)} aria-label={`Remove stop ${i + 1}`} className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-charcoal/25 bg-white text-forest hover:bg-red-50 hover:text-red-800"><IconTrash /></button>}
                      </li>
                    ))}
                  </ul>
                  {show('stops') && <p id="stops-err" role="alert" className="mt-1.5 text-sm font-medium text-red-800">⚠ {show('stops')}</p>}
                  <Button variant="ghost" size="sm" className="mt-2 -ml-3" onClick={addStop} disabled={v.stops.length >= 15}><IconPlus size={18} />Add another stop</Button>
                </div>
              </Section>

              <Section n="2" title="Vehicle & dates">
                <Field id="b-vehicle" as="select" label="Vehicle" required value={v.vehicle} onChange={set('vehicle')} onBlur={blur('vehicle')} error={show('vehicle')}>
                  <option value="">Choose a vehicle…</option>
                  {vehicles.map((x) => <option key={x._id} value={x._id}>{x.name} - up to {x.capacity} passengers</option>)}
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="b-sd" type="date" label="Travel start date" required min={todayISO()} value={v.startDate} onChange={(e) => setDates(e.target.value, v.endDate && e.target.value > v.endDate ? '' : v.endDate)} onBlur={blur('startDate')} error={show('startDate')} />
                  <Field id="b-ed" type="date" label="Travel end date" required min={v.startDate || todayISO()} value={v.endDate} onChange={(e) => setDates(v.startDate, e.target.value)} onBlur={blur('endDate')} error={show('endDate')} />
                  <Field id="b-time" type="time" label="Journey start time" required value={v.startTime} onChange={set('startTime')} onBlur={blur('startTime')} error={show('startTime')} />
                  <Field id="b-pax" type="number" inputMode="numeric" min="1" max={vehicle?.capacity || undefined} label="Number of passengers" required value={v.passengers} onChange={set('passengers')} onBlur={blur('passengers')} hint={vehicle ? `${vehicle.name} seats up to ${vehicle.capacity}.` : undefined} error={show('passengers')} />
                </div>
                <div aria-live="polite"><AvailabilityPanel state={avail} vehicle={vehicle} /></div>
                {v.vehicle ? (
                  <div>
                    <p className="mb-2 text-sm font-bold text-forest">Or pick your dates on the calendar</p>
                    <AvailabilityCalendar busy={busy} start={v.startDate} end={v.endDate} onChange={setDates} />
                    <p className="mt-2 text-sm text-charcoal/75">Click a start day, then an end day. Booked days are disabled; the full range is checked when you choose it.</p>
                  </div>
                ) : <p className="text-sm text-charcoal/75">Select a vehicle to see its calendar.</p>}
              </Section>

              <Section n="3" title="Your details">
                <Field id="b-name" label="Full name" required autoComplete="name" value={v.name} onChange={set('name')} onBlur={blur('name')} error={show('name')} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="b-phone" type="tel" inputMode="tel" label="Phone number" required autoComplete="tel" placeholder="+00 000 000 0000" value={v.phone} onChange={set('phone')} onBlur={blur('phone')} error={show('phone')} />
                  <Field id="b-email" type="email" label="Email" required autoComplete="email" value={v.email} onChange={set('email')} onBlur={blur('email')} error={show('email')} />
                </div>
                <Field id="b-notes" as="textarea" rows={4} label="Notes or special requirements" placeholder="Child seats, accessibility needs, luggage, preferred driver language…" value={v.notes} onChange={set('notes')} error={show('notes')} hint={`${v.notes.length}/1000`} />
              </Section>

              <div className="space-y-4">
                {submit.status === 'error' && <Notice tone="error" title="We couldn’t send your request">{submit.message}</Notice>}
                {blocked && <Notice tone="error" title="This request can’t be sent">The selected vehicle is unavailable for your dates. Adjust the dates or vehicle to continue.</Notice>}
                <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" loading={submit.status === 'sending'} disabled={blocked}>Send booking request</Button>
                <p className="text-sm text-charcoal/75">This sends a <strong>request</strong>. Your booking is only confirmed when our team replies - until then it is shown as pending.</p>
              </div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24" aria-label="Request summary">
              <div className="card overflow-hidden">
                <div className="aspect-[4/3] bg-sage-100">{vehicle ? <VehicleMedia vehicle={vehicle} image={vehicle.images?.[0]} /> : <div className="flex h-full items-center justify-center p-8 text-center text-charcoal/70">Choose a vehicle to see it here.</div>}</div>
                <div className="space-y-3 p-6">
                  <h2 className="text-2xl font-extrabold">{vehicle ? vehicle.name : 'Your vehicle'}</h2>
                  {vehicle && <p className="text-sm text-charcoal/80">{vehicle.description}</p>}
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-charcoal/70">Dates</dt><dd className="text-right font-medium">{v.startDate && v.endDate ? formatRange(v.startDate, v.endDate) : v.startDate ? `${formatDate(v.startDate)} → ?` : '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-charcoal/70">Passengers</dt><dd className="font-medium">{v.passengers || '—'}</dd></div>
                  </dl>
                  <div className="pt-1">
                    <StatusBadge status={avail.status === 'unavailable' ? 'unavailable' : avail.status === 'available' ? 'available' : 'pending'} />
                    <p className="mt-2 text-xs text-charcoal/70">{avail.status === 'unavailable' ? 'Conflicts with a confirmed booking.' : avail.status === 'available' ? 'Open now - becomes pending when sent.' : 'No dates held until we confirm.'}</p>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        )}
      </section>
      <TrackRequest />
    </>
  );
}
