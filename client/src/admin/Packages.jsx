import { useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import { EmptyState, ErrorState, Notice, Spinner } from '../components/States';
import { IconPin, IconPlus, IconTrash } from '../components/Icons';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';

const EMPTY = { title: '', destination: '', startLocation: '', startDate: '', endDate: '', startTime: '09:00', endTime: '17:00', duration: '', description: '', price: '' };

export default function Packages() {
  const { data, error, loading, reload, setData } = useAsync(api.admin.packages, []);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, error: '', success: '' });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: '', success: '' });
    try {
      const item = await api.admin.createPackage(form);
      setData((current) => [item, ...(current || [])]);
      setForm(EMPTY);
      setState({ busy: false, error: '', success: 'Package published on the home page.' });
    } catch (err) {
      setState({ busy: false, error: err.message, success: '' });
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove “${item.title}” from the home page?`)) return;
    try {
      await api.admin.deletePackage(item.id);
      setData((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setState({ busy: false, error: err.message, success: '' });
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold">Travel packages</h1>
      <p className="mt-2 max-w-2xl text-charcoal/75">Publish current offers for visitors. Package start place, destination, dates, and departure time are fixed for customers who book that package.</p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-5 sm:p-7" aria-label="Add travel package">
        <h2 className="text-2xl font-bold">Add a package</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="package-title" label="Package title" required maxLength={80} placeholder="e.g. Hills and Tea Gardens" value={form.title} onChange={set('title')} />
          <Field id="package-destination" label="Destination" required maxLength={160} placeholder="e.g. Munnar, Kerala" value={form.destination} onChange={set('destination')} />
          <Field id="package-start-location" label="Starting place" required maxLength={160} placeholder="e.g. Kochi Airport" value={form.startLocation} onChange={set('startLocation')} />
          <Field id="package-duration" label="Duration" maxLength={80} placeholder="e.g. 3 days / 2 nights" value={form.duration} onChange={set('duration')} />
          <Field id="package-start-date" type="date" label="Travel start date" required value={form.startDate} onChange={set('startDate')} />
          <Field id="package-end-date" type="date" label="Travel end date" required min={form.startDate || undefined} value={form.endDate} onChange={set('endDate')} />
          <Field id="package-start-time" type="time" label="Departure time" required value={form.startTime} onChange={set('startTime')} />
          <Field id="package-end-time" type="time" label="End time" required value={form.endTime} onChange={set('endTime')} />
          <Field id="package-price" label="Price or price note" maxLength={80} placeholder="e.g. From ₹12,000" value={form.price} onChange={set('price')} />
        </div>
        <Field id="package-description" as="textarea" rows={4} label="Package details" required minLength={10} maxLength={1000} placeholder="What is included, key stops, and other details customers should know." value={form.description} onChange={set('description')} />
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.success && <Notice tone="success">{state.success}</Notice>}
        <Button type="submit" variant="dark" loading={state.busy} disabled={form.title.trim().length < 2 || form.destination.trim().length < 2 || form.startLocation.trim().length < 2 || !form.startDate || !form.endDate || !form.startTime || !form.endTime || form.description.trim().length < 10}><IconPlus size={18} />Publish package</Button>
      </form>

      <section className="mt-10" aria-labelledby="published-packages-heading">
        <h2 id="published-packages-heading" className="text-2xl font-bold">Published packages</h2>
        {loading && <Spinner label="Loading packages…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && data?.length === 0 && <EmptyState title="No packages published">Add a package above and it will appear on the home page.</EmptyState>}
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {(data || []).map((item) => (
            <li key={item.id} className="card p-5">
              <h3 className="font-display text-xl font-bold">{item.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 font-medium text-forest"><IconPin size={18} />{item.destination}</p>
              {item.startDate && item.endDate && item.startLocation && item.startTime
                ? <p className="mt-2 text-sm text-charcoal/75">{item.startLocation} · {item.startDate} to {item.endDate} · {item.startTime}–{item.endTime || '23:59'}</p>
                : <Notice tone="warn" className="mt-2">This older package has no fixed schedule. Remove and recreate it with a starting place, dates, and departure time to show it to customers.</Notice>}
              {(item.duration || item.price) && <p className="mt-2 text-sm text-charcoal/75">{[item.duration, item.price].filter(Boolean).join(' · ')}</p>}
              <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{item.description}</p>
              <Button variant="ghost" size="sm" className="mt-3 !text-red-800 hover:!bg-red-50" onClick={() => remove(item)} aria-label={`Remove ${item.title}`}><IconTrash size={18} />Remove package</Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
