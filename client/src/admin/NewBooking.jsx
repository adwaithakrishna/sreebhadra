import { useMemo, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import { ErrorState, Notice, Spinner } from '../components/States';
import { api, ApiError } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { todayISO } from '../lib/format';

const EMPTY = {
  vehicle: '', name: '', phone: '', email: '', startLocation: '', destination: '',
  startDate: '', endDate: '', startTime: '09:00', endTime: '17:00', passengers: '2', notes: '',
};

export default function NewBooking() {
  const { data, error: vehiclesError, loading, reload } = useAsync(api.admin.vehicles, []);
  const vehicles = useMemo(() => (data || []).filter((item) => item.availability === 'available'), [data]);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, error: '', fields: {}, booking: null });
  const vehicle = vehicles.find((item) => item._id === form.vehicle);
  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setState((current) => ({ ...current, fields: { ...current.fields, [key]: undefined } }));
  };

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: '', fields: {}, booking: null });
    try {
      const booking = await api.admin.createBooking({
        ...form,
        stops: [form.destination],
        passengers: Number(form.passengers),
      });
      setState({ busy: false, error: '', fields: {}, booking });
    } catch (err) {
      setState({ busy: false, error: err.message, fields: err instanceof ApiError ? err.fieldErrors : {}, booking: null });
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Button to="/admin/bookings" variant="ghost" size="sm">Back to bookings</Button>
        <h1 className="mt-3 text-4xl font-extrabold">Add a booking</h1>
        <p className="mt-2 max-w-2xl text-charcoal/75">Record a trip for a customer who booked by phone or in person. The new booking stays pending until it is confirmed.</p>
      </div>

      {state.booking && (
        <Notice tone="success" title={`Booking ${state.booking.reference} added`} className="mb-6">
          It is pending confirmation and is now in the bookings list.{' '}
          <Button to={`/admin/bookings?open=${state.booking.id}`} variant="ghost" size="sm">View booking</Button>
        </Notice>
      )}
      {state.error && <Notice tone="error" title="Couldn’t add this booking" className="mb-6">{state.error}</Notice>}
      {loading && <Spinner label="Loading vehicles…" />}
      {vehiclesError && <ErrorState error={vehiclesError} onRetry={reload} title="Vehicles couldn’t be loaded" />}
      {!loading && !vehiclesError && vehicles.length === 0 && <Notice title="No vehicles available">Add or mark a vehicle as available before recording a booking.</Notice>}

      {!loading && !vehiclesError && vehicles.length > 0 && (
        <form onSubmit={submit} className="space-y-6">
          <section className="card space-y-5 p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Customer details</h2>
            <Field id="admin-booking-name" label="Customer name" required autoComplete="name" value={form.name} onChange={set('name')} error={state.fields.name} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="admin-booking-phone" type="tel" inputMode="tel" label="Phone number" required autoComplete="tel" value={form.phone} onChange={set('phone')} error={state.fields.phone} />
              <Field id="admin-booking-email" type="email" label="Email" autoComplete="email" value={form.email} onChange={set('email')} error={state.fields.email} />
            </div>
          </section>

          <section className="card space-y-5 p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Trip details</h2>
            <Field id="admin-booking-vehicle" as="select" label="Vehicle" required value={form.vehicle} onChange={set('vehicle')} error={state.fields.vehicle}>
              <option value="">Choose a vehicle…</option>
              {vehicles.map((item) => <option key={item._id} value={item._id}>{item.name} — up to {item.capacity} passengers</option>)}
            </Field>
            <Field id="admin-booking-start" label="Starting place" required value={form.startLocation} onChange={set('startLocation')} error={state.fields.startLocation} />
            <Field id="admin-booking-destination" label="Destination" required value={form.destination} onChange={set('destination')} error={state.fields.stops} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="admin-booking-start-date" type="date" label="Travel start date" required min={todayISO()} value={form.startDate} onChange={set('startDate')} error={state.fields.startDate} />
              <Field id="admin-booking-end-date" type="date" label="Travel end date" required min={form.startDate || todayISO()} value={form.endDate} onChange={set('endDate')} error={state.fields.endDate} />
              <Field id="admin-booking-time" type="time" label="Start time" required value={form.startTime} onChange={set('startTime')} error={state.fields.startTime} />
              <Field id="admin-booking-end-time" type="time" label="End time" required value={form.endTime} onChange={set('endTime')} error={state.fields.endTime} />
              <Field id="admin-booking-passengers" type="number" min="1" max={vehicle?.capacity || undefined} label="Passengers" required value={form.passengers} onChange={set('passengers')} error={state.fields.passengers} />
            </div>
            <Field id="admin-booking-notes" as="textarea" rows={4} label="Notes or special requirements" maxLength={1000} value={form.notes} onChange={set('notes')} error={state.fields.notes} />
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="primary" loading={state.busy} disabled={state.busy}>Add booking</Button>
            <p className="text-sm text-charcoal/75">The booking will be created as pending. Confirm it from the bookings list after checking with the customer.</p>
          </div>
        </form>
      )}
    </div>
  );
}
