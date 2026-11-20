import Button from '../components/Button';
import Reveal from '../components/Reveal';
import VehicleCard from '../components/VehicleCard';
import { Spinner, ErrorState, EmptyState, Notice } from '../components/States';
import { IconArrow, IconClock, IconPin, IconShield, IconStar, IconUsers } from '../components/Icons';
import { api } from '../lib/api';
import { formatRange, formatTime } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STEPS = [
  { n: '01', t: 'Share your route', d: 'Tell us where you start, every place you want to visit, and when you travel.' },
  { n: '02', t: 'Pick your vehicle', d: 'Choose the right size and see which dates are already taken before you send anything.' },
  { n: '03', t: 'We confirm', d: 'Your request is pending until our team checks availability and confirms it by phone or email.' },
  { n: '04', t: 'Travel easy', d: 'Your driver arrives on time. Sit back, watch the road go by, and enjoy the journey.' },
];
const TRUST = [
  { i: IconShield, t: 'Safety first', d: 'Regularly serviced vehicles, insured journeys and drivers who plan for the road ahead.' },
  { i: IconUsers, t: 'Experienced drivers', d: 'Local knowledge, calm driving and the patience to wait while you take the photograph.' },
  { i: IconClock, t: 'Honest confirmations', d: 'A booking is only confirmed once we say so. No surprise double-bookings.' },
  { i: IconStar, t: 'Comfort as standard', d: 'Air-conditioned cabins, space for luggage and room to stretch out on long routes.' },
];
export default function Home() {
  useDocumentTitle('');
  const { data: vehicles, error, loading, reload } = useAsync(api.vehicles, []);
  const { data: reviews, loading: reviewsLoading } = useAsync(api.reviews, []);
  const { data: packages, error: packagesError, loading: packagesLoading, reload: reloadPackages } = useAsync(api.packages, []);
  const featured = (vehicles || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="container-x pt-12 sm:pt-20">
          <p className="eyebrow animate-rise whitespace-nowrap">
  <span className="text-[#E9A83A]">Sree Bhadra</span> · Your Gateway of Expedition
</p>
          <h1 className="display-xl mt-5 max-w-6xl animate-rise [animation-delay:80ms]">
            Travel More,<br/>Explore More.<br />
            <span className="text-forest/90"> Your Journey,</span><span className="relative inline-block">OUR RESPONSIBILITY.<span className="absolute inset-x-0 bottom-1 -z-10 h-[0.18em] bg-sun" aria-hidden="true" /></span>
          </h1>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-xl animate-rise text-lg leading-relaxed text-charcoal/90 [animation-delay:160ms] sm:text-xl">
               Explore beautiful destinations, enjoy comfortable journeys and create memories that last forever.Book Your Trip Today!.
            </p>
            <div className="flex animate-rise flex-wrap items-center gap-4 [animation-delay:240ms]">
              <Button to="/booking" variant="primary" size="lg">Book your journey <IconArrow /></Button>
              <Button to="/gallery" variant="outline" size="lg">See the gallery</Button>
            </div>
          </div>
        </div>
        <div className="container-x mt-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(23,60,50,.6)] sm:aspect-[16/8] lg:aspect-[21/9]">
            <div className="container-x mt-12">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(23,60,50,.6)] sm:aspect-[16/8] lg:aspect-[21/9]">
              <img
                src="/images/suv.jpeg"
                alt="SUV driving along a hillside road at golden hour"
                className="h-full w-full object-cover"
              />
              <ul className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:bottom-6 sm:left-6">
                  {['Experienced drivers', 'Air-conditioned', 'Clear confirmations'].map((t) => (
                  <li key={t} className="rounded-full bg-ivory/95 px-4 py-2 text-sm font-bold text-forest shadow">{t}</li>
                   ))}
              </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="container-x grid gap-10 py-24 lg:grid-cols-12 lg:py-32">
        <Reveal className="lg:col-span-5"><p className="eyebrow">The service</p><h2 className="display-lg mt-4">Travel that feels planned, not rushed.</h2></Reveal>
        <Reveal delay={120} className="space-y-5 text-lg leading-relaxed text-charcoal/90 lg:col-span-6 lg:col-start-7">
          <p>We provide our vehicle with professional drivers for day trips, transfers, family holidays and group outings. You tell us the route; we handle the rest.</p>
          <p>Every request is checked by a real person against the real calendar, so when we say a vehicle is yours, it is.</p>
          <Button to="/about" variant="ghost" className="-ml-4">About our service <IconArrow /></Button>
        </Reveal>
      </section>

      <section className="bg-sun-100 py-20 sm:py-24" aria-labelledby="home-packages-heading">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">New travel offers</p>
              <h2 id="home-packages-heading" className="display-lg mt-3">Packages for your next trip.</h2>
            </div>
            <span className="rounded-full bg-forest px-4 py-2 text-sm font-bold text-ivory">Latest packages</span>
          </Reveal>
          <div className="mt-9">
            {packagesLoading && <Spinner label="Loading travel packages…" />}
            {packagesError && <ErrorState error={packagesError} onRetry={reloadPackages} title="Packages couldn’t be loaded" />}
            {!packagesLoading && !packagesError && packages?.length === 0 && (
              <Notice title="No current packages">New packages will appear here when the admin publishes an upcoming offer.</Notice>
            )}
            {!packagesLoading && !packagesError && packages?.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((item, i) => (
                  <Reveal key={item.id} delay={i * 70}>
                    <article className="card flex h-full flex-col p-6">
                      <p className="eyebrow">{item.title}</p>
                      <h3 className="mt-2 flex items-start gap-2 font-display text-2xl font-extrabold text-forest"><IconPin className="mt-1 shrink-0" />{item.destination}</h3>
                      <p className="mt-2 text-sm font-medium text-charcoal/75">{item.startLocation} → {item.destination}</p>
                      <p className="mt-1 text-sm text-charcoal/75">{formatRange(item.startDate, item.endDate)} · {formatTime(item.startTime)}{item.duration ? ` · ${item.duration}` : ''}</p>
                      {item.price && <p className="mt-2 text-sm font-bold text-forest">{item.price}</p>}
                      <p className="mt-3 flex-1 leading-relaxed text-charcoal/85">{item.description}</p>
                      <Button to={`/booking?package=${encodeURIComponent(item.id)}`} variant="outline" size="sm" className="mt-5 self-start">Book this package <IconArrow /></Button>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured vehicles */}
      <section className="bg-sage-100 py-24 lg:py-28">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div><p className="eyebrow">The fleet</p><h2 className="display-lg mt-4">Featured vehicle</h2></div>
            <Button to="/gallery" variant="outline">View vehicle <IconArrow /></Button>
          </Reveal>
          <div className="mt-12">
            {loading && <Spinner label="Loading vehicle…" />}
            {error && <ErrorState error={error} onRetry={reload} title="Vehicles are unavailable right now" />}
            {!loading && !error && featured.length === 0 && <EmptyState title="Our fleet is being updated">Please check back soon, or contact us to arrange a vehicle.</EmptyState>}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((v, i) => <Reveal key={v._id} delay={i * 100}><VehicleCard vehicle={v} className="h-full" /></Reveal>)}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-24 lg:py-32">
        <Reveal><p className="eyebrow">How it works</p><h2 className="display-lg mt-4 max-w-3xl">Four steps for book your Journey .</h2></Reveal>
        <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 90} className="border-t-2 border-forest pt-5">
              <span className="font-display text-5xl font-extrabold text-sun">{s.n}</span>
              <h3 className="mt-4 text-2xl font-bold">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-charcoal/85">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Trust */}
      <section className="bg-forest py-24 text-ivory lg:py-28">
        <div className="container-x">
          <Reveal><p className="eyebrow !text-sage">Why travellers choose us</p><h2 className="display-lg mt-4 max-w-3xl !text-ivory">Built on trust, one trip at a time.</h2></Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ i: Icon, t, d }, k) => (
              <Reveal key={t} delay={k * 90}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sun text-forest"><Icon size={24} /></span>
                <h3 className="mt-5 text-xl font-bold !text-ivory">{t}</h3>
                <p className="mt-2 leading-relaxed text-ivory/85">{d}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-16">
            {reviewsLoading ? <p className="text-sm text-sage">Loading customer reviews…</p> : reviews?.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review, i) => (
                  <figure key={`${review.vehicle || 'trip'}-${i}`} className="rounded-2xl bg-forest-800 p-7">
                    <p className="font-bold tracking-wider text-sun" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} <span className="text-sm">{review.rating}/5</span></p>
                    <blockquote className="mt-4 text-lg leading-relaxed">“{review.comment}”</blockquote>
                    <figcaption className="mt-4 text-sm text-sage">Verified traveler{review.vehicle ? ` · ${review.vehicle}` : ''}</figcaption>
                  </figure>
                ))}
              </div>
            ) : <p className="rounded-2xl bg-forest-800 p-7 text-sage">Customer reviews will appear here after travelers share feedback about completed trips.</p>}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-24 lg:py-32">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-sun px-8 py-14 sm:px-14 sm:py-20">
          <h2 className="display-lg max-w-3xl">Where to next? Let’s plan your route.</h2>
          <p className="mt-5 max-w-xl text-lg text-forest/90">Send a request in two minutes. We’ll confirm availability and get back to you.</p>
          <Button to="/booking" variant="dark" size="lg" className="mt-8">Book your journey <IconArrow /></Button>
        </Reveal>
      </section>
    </>
  );
}
