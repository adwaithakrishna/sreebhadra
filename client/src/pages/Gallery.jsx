import { Spinner, ErrorState, Notice } from '../components/States';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Gallery() {
  useDocumentTitle('Trip gallery');
  const { data: trips, error, loading, reload } = useAsync(api.tripPhotos, []);

  return (
    <section className="container-x py-12 pb-24 sm:py-16" aria-labelledby="trip-gallery-heading">
        <div className="mb-8">
          <p className="eyebrow">From the road</p>
          <h2 id="trip-gallery-heading" className="display-lg mt-3">Places we’ve visited.</h2>
        </div>
        {loading && <Spinner label="Loading trip photos…" />}
        {error && <ErrorState error={error} onRetry={reload} title="Trip photos couldn’t be loaded" />}
        {!loading && !error && trips?.length === 0 && (
          <Notice title="No trip photos yet">Photos added by the admin will appear here with their destination and description.</Notice>
        )}
        {!loading && !error && trips?.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <article key={trip.id} className="card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-sage-100">
                  <img
                    src={trip.url}
                    alt={`${trip.vehicle?.name || 'Vehicle'} at ${trip.destination}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
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
  );
}
