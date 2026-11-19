import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { Spinner, ErrorState, EmptyState, Notice } from '../components/States';
import Modal from '../components/Modal';
import Field from '../components/Field';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import VehicleMedia from '../components/VehicleMedia';
import ImageManager from './ImageManager';
import { IconPlus } from '../components/Icons';
import { TYPE_LABEL } from '../lib/format';

const BLANK = { name: '', type: 'sedan', capacity: '4', luggage: '2', description: '', amenities: '', availability: 'available' };
const toForm = (v) => ({ name: v.name, type: v.type, capacity: String(v.capacity), luggage: String(v.luggage ?? 0), description: v.description, amenities: (v.amenities || []).join(', '), availability: v.availability });

function VehicleEditor({ vehicle, onClose, onSaved, onDeleted }) {
  const [saved, setSaved] = useState(vehicle); // becomes set after first save of a new vehicle
  const [f, setF] = useState(vehicle ? toForm(vehicle) : BLANK);
  const [st, setSt] = useState({ busy: false, error: '', fields: {}, ok: false });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setSt((s) => ({ ...s, ok: false, fields: { ...s.fields, [k]: undefined } })); };

  async function save(e) {
    e.preventDefault();
    setSt({ busy: true, error: '', fields: {}, ok: false });
    const body = { ...f, capacity: Number(f.capacity), luggage: Number(f.luggage || 0), amenities: f.amenities.split(',').map((a) => a.trim()).filter(Boolean) };
    try {
      const v = saved ? await api.admin.updateVehicle(saved._id, body) : await api.admin.createVehicle(body);
      setSaved(v); onSaved(v);
      setSt({ busy: false, error: '', fields: {}, ok: true });
    } catch (err) {
      setSt({ busy: false, error: err.message, fields: err instanceof ApiError ? err.fieldErrors : {}, ok: false });
    }
  }
  async function remove() {
    try { await api.admin.deleteVehicle(saved._id); onDeleted(saved._id); onClose(); } catch (err) { setConfirmDel(false); setSt((s) => ({ ...s, error: err.message })); }
  }

  return (
    <Modal open onClose={onClose} title={saved ? `Edit ${saved.name}` : 'Add vehicle'} size="xl">
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-2">
        <form onSubmit={save} noValidate className="space-y-4" aria-label="Vehicle details">
          <h3 className="text-xl font-bold">Details</h3>
          <Field id="v-name" label="Name" required value={f.name} onChange={set('name')} error={st.fields.name} maxLength={80} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="v-type" as="select" label="Type" required value={f.type} onChange={set('type')} error={st.fields.type}>
              {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Field>
            <Field id="v-av" as="select" label="Availability" required value={f.availability} onChange={set('availability')} error={st.fields.availability} hint="Maintenance / hidden vehicles can’t be booked.">
              <option value="available">Available for booking</option><option value="maintenance">Under maintenance</option><option value="hidden">Hidden from website</option>
            </Field>
            <Field id="v-cap" type="number" min="1" max="100" label="Passenger capacity" required value={f.capacity} onChange={set('capacity')} error={st.fields.capacity} />
            <Field id="v-lug" type="number" min="0" max="100" label="Luggage (bags)" value={f.luggage} onChange={set('luggage')} error={st.fields.luggage} />
          </div>
          <Field id="v-desc" as="textarea" rows={4} label="Description" required value={f.description} onChange={set('description')} error={st.fields.description} maxLength={1000} />
          <Field id="v-am" label="Amenities" value={f.amenities} onChange={set('amenities')} error={st.fields.amenities} hint="Separate with commas, e.g. Air conditioning, Wi-Fi, USB ports" />
          {st.error && <Notice tone="error">{st.error}</Notice>}
          {st.ok && <Notice tone="success">Saved.{!vehicle && ' You can now add photos.'}</Notice>}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" variant="dark" loading={st.busy}>{saved ? 'Save changes' : 'Create vehicle'}</Button>
            {saved && !confirmDel && <Button variant="ghost" className="!text-red-800 hover:!bg-red-50" onClick={() => setConfirmDel(true)}>Delete vehicle</Button>}
          </div>
          {confirmDel && (
            <div role="alertdialog" aria-label="Confirm delete" className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Permanently delete {saved.name} and its photos? To simply stop taking bookings, set it to “Hidden” instead.</p>
              <div className="mt-3 flex gap-2"><Button variant="danger" size="sm" onClick={remove}>Yes, delete</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Keep</Button></div>
            </div>
          )}
        </form>
        <div>
          <h3 className="mb-4 text-xl font-bold">Photos</h3>
          {saved ? <ImageManager vehicle={saved} onImages={(images) => { const v = { ...saved, images }; setSaved(v); onSaved(v); }} /> : <Notice>Create the vehicle first, then add photos here.</Notice>}
        </div>
      </div>
    </Modal>
  );
}

export default function Vehicles() {
  const { data, error, loading, reload, setData } = useAsync(api.admin.vehicles, []);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const upsert = (v) => setData((list) => (list.some((x) => x._id === v._id) ? list.map((x) => (x._id === v._id ? v : x)) : [...list, v]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Vehicles</h1>
        <Button variant="primary" onClick={() => setEditing(null)}><IconPlus size={18} />Add vehicle</Button>
      </div>
      <div className="mt-6">
        {loading && <Spinner label="Loading vehicles…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.length === 0 && <EmptyState title="No vehicles yet" action={<Button variant="primary" onClick={() => setEditing(null)}>Add your first vehicle</Button>}>Add a vehicle so customers can book it.</EmptyState>}
        <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {(data || []).map((v) => (
            <li key={v._id} className="card flex overflow-hidden">
              <div className="w-36 shrink-0 bg-sage-100"><VehicleMedia vehicle={v} image={v.images?.[0]} /></div>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-xl font-bold">{v.name}</h2></div>
                <p className="mt-1 text-sm text-charcoal/80">{TYPE_LABEL[v.type]} · {v.capacity} seats · {v.images?.length || 0} photo(s)</p>
                <div className="mt-2"><StatusBadge status={v.availability} /></div>
                <Button size="sm" variant="outline" className="mt-auto self-start" onClick={() => setEditing(v)} aria-label={`Edit ${v.name}`}>Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {editing !== undefined && <VehicleEditor key={editing?._id || 'new'} vehicle={editing} onClose={() => setEditing(undefined)} onSaved={upsert} onDeleted={(id) => setData((l) => l.filter((x) => x._id !== id))} />}
    </div>
  );
}
