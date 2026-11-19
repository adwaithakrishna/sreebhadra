import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import { ErrorState, EmptyState, Notice, Spinner } from '../components/States';
import { IconPin, IconTrash, IconUpload } from '../components/Icons';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Trips() {
  const { data: trips, error, loading, reload, setData } = useAsync(api.admin.trips, []);
  const { data: vehicles, loading: vehiclesLoading } = useAsync(api.admin.vehicles, []);
  const [vehicle, setVehicle] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ error: '', success: '' });
  const input = useRef(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null;
    event.target.value = '';
    if (!selected) return;
    if (!OK_TYPES.includes(selected.type)) {
      setMessage({ error: 'Choose a JPEG, PNG or WebP image.', success: '' });
      return;
    }
    if (selected.size > MAX_BYTES) {
      setMessage({ error: 'The image must be 5 MB or smaller.', success: '' });
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage({ error: '', success: '' });
  }

  async function save(event) {
    event.preventDefault();
    if (!file) return setMessage({ error: 'Choose a trip photo.', success: '' });
    setBusy(true);
    setMessage({ error: '', success: '' });
    try {
      const created = await api.admin.createTrip({ vehicle, destination, description, image: file });
      setData((current) => [created, ...(current || [])]);
      setDestination('');
      setDescription('');
      setFile(null);
      setPreview('');
      setMessage({ error: '', success: 'Trip photo added to the public gallery.' });
    } catch (err) {
      setMessage({ error: err.message, success: '' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(trip) {
    if (!window.confirm(`Delete the trip photo for ${trip.destination}?`)) return;
    try {
      await api.admin.deleteTrip(trip.id);
      setData((current) => current.filter((item) => item.id !== trip.id));
    } catch (err) {
      setMessage({ error: err.message, success: '' });
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold">Trip gallery</h1>
      <p className="mt-2 max-w-2xl text-charcoal/75">Add a photo from a completed trip, choose the vehicle, and describe where it went. Published entries appear on the public Gallery page.</p>

      <form onSubmit={save} className="card mt-6 grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]" aria-label="Add trip gallery photo">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Add a trip photo</h2>
          {vehiclesLoading ? <Spinner label="Loading vehicles…" /> : !vehicles?.length ? <Notice>Add a vehicle first in Vehicles, then you can attach trip photos to it.</Notice> : (
            <Field id="trip-vehicle" as="select" label="Vehicle" required value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">Choose a vehicle</option>
              {vehicles.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Field>
          )}
          <Field id="trip-destination" label="Trip destination / places visited" required maxLength={160} placeholder="e.g. Ooty via Coonoor" value={destination} onChange={(e) => setDestination(e.target.value)} />
          <Field id="trip-description" as="textarea" rows={4} label="Trip description" required minLength={3} maxLength={1000} placeholder="Describe the journey and what made it memorable." value={description} onChange={(e) => setDescription(e.target.value)} />
          <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} aria-label="Choose trip photo" />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => input.current?.click()}><IconUpload size={18} />{file ? 'Choose another photo' : 'Choose photo'}</Button>
            <Button type="submit" variant="dark" loading={busy} disabled={!vehicle || !destination.trim() || description.trim().length < 3 || !file}>Publish to gallery</Button>
          </div>
          <p className="text-sm text-charcoal/70">JPEG, PNG or WebP, up to 5 MB.</p>
          {message.error && <Notice tone="error">{message.error}</Notice>}
          {message.success && <Notice tone="success">{message.success}</Notice>}
        </div>
        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-sage-100">
          {preview ? <img src={preview} alt="Trip photo preview" className="h-full max-h-80 w-full object-cover" /> : <p className="p-6 text-center text-sm text-charcoal/60">Your selected photo preview will appear here.</p>}
        </div>
      </form>

      <section className="mt-10" aria-labelledby="published-trips-heading">
        <h2 id="published-trips-heading" className="text-2xl font-bold">Published trip photos</h2>
        {loading && <Spinner label="Loading trip photos…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && trips?.length === 0 && <EmptyState title="No trip photos yet">Add a photo above to start building the public gallery.</EmptyState>}
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(trips || []).map((trip) => (
            <li key={trip.id} className="card overflow-hidden">
              <img src={trip.url} alt={`${trip.vehicle?.name || 'Vehicle'} at ${trip.destination}`} className="aspect-[4/3] w-full object-cover" />
              <div className="p-5">
                <p className="font-bold">{trip.vehicle?.name || 'Vehicle'}</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-xl font-bold text-forest"><IconPin size={18} />{trip.destination}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal/80">{trip.description}</p>
                <Button variant="ghost" size="sm" className="mt-4 !text-red-800 hover:!bg-red-50" onClick={() => remove(trip)} aria-label={`Delete trip photo for ${trip.destination}`}><IconTrash size={18} />Delete photo</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
