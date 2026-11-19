import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import VehicleCard from '../components/VehicleCard';
import VehicleMedia from '../components/VehicleMedia';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import { IconBag, IconCheck, IconUsers } from '../components/Icons';
import { api } from '../lib/api';
import { TYPE_LABEL } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function VehicleDetail({ vehicle }) {
  const [idx, setIdx] = useState(0);
  const images = vehicle.images || [];
  const current = images[idx];
  return (
    <div className="grid gap-0 md:grid-cols-2">
      <div className="bg-sage-100">
        <div className="aspect-[4/3] w-full overflow-hidden"><VehicleMedia key={current?.id || 'art'} vehicle={vehicle} image={current} eager /></div>
        {images.length > 1 && (
          <ul className="flex gap-2 overflow-x-auto p-3" aria-label="Photos">
            {images.map((im, i) => (
              <li key={im.id}>
                <button type="button" onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}: ${im.altText}`} aria-current={i === idx} className={`h-16 w-20 overflow-hidden rounded-lg ring-2 ${i === idx ? 'ring-forest' : 'ring-transparent'}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {current?.altText && <p className="px-4 pb-3 text-sm text-charcoal/70">{current.altText}</p>}
      </div>
      <div className="p-6 sm:p-8">
        <p className="eyebrow">{TYPE_LABEL[vehicle.type]}</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-medium">
          <li className="flex items-center gap-2"><IconUsers className="text-forest" />Up to {vehicle.capacity} passengers</li>
          {vehicle.luggage > 0 && <li className="flex items-center gap-2"><IconBag className="text-forest" />{vehicle.luggage} bags</li>}
        </ul>
        <p className="mt-5 leading-relaxed">{vehicle.description}</p>
        {vehicle.amenities?.length > 0 && (
          <>
            <h3 className="mt-6 text-lg font-bold">Amenities</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {vehicle.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-[15px]"><IconCheck size={18} className="text-forest" />{a}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  useDocumentTitle('Gallery');
  const { data, error, loading, reload } = useAsync(api.vehicles, []);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const types = useMemo(() => [...new Set((data || []).map((v) => v.type))], [data]);
  const list = (data || []).filter((v) => filter === 'all' || v.type === filter);

  return (
    <>
      <PageHero eyebrow="Gallery" title="Meet the fleet.">Every vehicle is cleaned, serviced and driven by a professional. Open any card for photos, amenities and details.</PageHero>
      <section className="container-x pb-24">
        {types.length > 1 && (
          <div role="group" aria-label="Filter by vehicle type" className="mb-10 flex flex-wrap gap-2">
            {['all', ...types].map((t) => (
              <button key={t} type="button" aria-pressed={filter === t} onClick={() => setFilter(t)} className={`rounded-full border-2 px-5 py-2 text-sm font-bold transition ${filter === t ? 'border-forest bg-forest text-ivory' : 'border-forest/30 text-forest hover:border-forest'}`}>
                {t === 'all' ? 'All vehicles' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
        {loading && <Spinner label="Loading vehicles…" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && list.length === 0 && <EmptyState title="No vehicles to show" action={filter !== 'all' && <Button variant="outline" onClick={() => setFilter('all')}>Show all vehicles</Button>}>Check back soon, or contact us and we’ll help arrange a vehicle.</EmptyState>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((v, i) => <Reveal key={v._id} delay={(i % 3) * 80}><VehicleCard vehicle={v} onView={setSelected} className="h-full" /></Reveal>)}
        </div>
      </section>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="xl">
        {selected && <VehicleDetail vehicle={selected} />}
      </Modal>
    </>
  );
}
