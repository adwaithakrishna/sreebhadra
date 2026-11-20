import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import VehicleCard from '../components/VehicleCard';
import VehicleMedia from '../components/VehicleMedia';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import { Spinner, ErrorState, EmptyState, Notice } from '../components/States';
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
  const { data: trips, error: tripsError, loading: tripsLoading, reload: reloadTrips } = useAsync(api.tripPhotos, []);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const types = useMemo(() => [...new Set((data || []).map((v) => v.type))], [data]);
  const list = (data || []).filter((v) => filter === 'all' || v.type === filter);

  return (
    <>
      <PageHero eyebrow="Gallery" title="Journeys and the fleet.">See places our vehicles have visited, then explore the vehicles and their photos.</PageHero>
      <section className="container-x py-16 sm:py-20" aria-labelledby="trip-gallery-heading">
        <div className="mb-8">
          <p className="eyebrow">From the road</p>
          <h2 id="trip-gallery-heading" className="display-lg mt-3">Trips we’ve taken.</h2>
          <p className="mt-3 max-w-2xl text-charcoal/75">Photos and notes from journeys shared by our team.</p>
        </div>
        {tripsLoading && <Spinner label="Loading trip photos…" />}
        {tripsError && <ErrorState error={tripsError} onRetry={reloadTrips} title="Trip photos couldn’t be loaded" />}
        {!tripsLoading && !tripsError && trips?.length === 0 && (
          <Notice title="No trip photos yet">New trip photos will appear here when the admin adds them.</Notice>
        )}
        {!tripsLoading && !tripsError && trips?.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <article key={trip.id} className="card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-sage-100">
                  <img src={trip.url} alt={`${trip.vehicle?.name || 'Vehicle'} at ${trip.destination}`} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <p className="eyebrow">{trip.vehicle?.name || 'Wayfarer trip'}</p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-forest">{trip.destination}</h3>
                  <p className="mt-2 leading-relaxed text-charcoal/80">{trip.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="container-x pb-24">
        <div className="mb-8">
          <p className="eyebrow">Our vehicles</p>
          <h2 className="display-lg mt-3">Meet the fleet.</h2>
          <p className="mt-3 max-w-2xl text-charcoal/75">Open any vehicle for its photos, amenities and details.</p>
        </div>
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
