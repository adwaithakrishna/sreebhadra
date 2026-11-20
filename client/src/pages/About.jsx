import PageHero from '../components/PageHero';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import VehicleArt from '../components/VehicleArt';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SITE } from '../lib/site';

const VALUES = [
  { t: 'Safety over speed', d: 'We would rather arrive ten minutes late than take a risk. Vehicles are inspected and drivers are briefed before every trip.' },
  { t: 'Straight answers', d: 'If a vehicle is booked, we say so. If your plan needs changing, we tell you early and suggest alternatives.' },
  { t: 'Local knowledge', d: 'Our drivers know the roads, the rest stops and the places worth the detour.' },
  { t: 'Respect for your time', d: 'Punctual pick-ups, clear communication and no hidden surprises on the day.' },
];
const EXPECT = ['A named driver and vehicle details before you travel', 'A clean, air-conditioned vehicle with room for your luggage', 'Flexibility for extra stops along your route (agreed in advance)', 'A real person to call if plans change'];

export default function About() {
  useDocumentTitle('About');
  return (
    <>
      <PageHero eyebrow="About us" title="A travel service built around the journey.">Sree Bhadra</PageHero>
      <section className="container-x grid items-center gap-12 pb-24 lg:grid-cols-2">
        <Reveal className="aspect-[4/3] overflow-hidden rounded-[2rem]"><img
  src="/images/about.jpeg"
  alt="Sree Bhadra vehicle on a trip"
  className="h-full w-full object-cover"
/></Reveal>
        <Reveal delay={100} className="space-y-5 text-lg leading-relaxed">
          <h2 className="text-3xl font-extrabold">What we do</h2>
          <p>Sree Bhadra makes every journey comfortable and dependable. We offer well-maintained vehicles with experienced drivers for family trips, local travel, airport transfers, and special occasions. Tell us where you’re going, and we’ll help you travel with confidence.</p>
          <p><strong className="text-forest">Service area:</strong> {SITE.serviceArea}. Longer routes beyond this area can often be arranged - just ask.</p>
        </Reveal>
      </section>
      <section className="bg-sage-100 py-24">
        <div className="container-x">
          <Reveal><p className="eyebrow">Our values</p><h2 className="display-lg mt-4">What we stand for.</h2></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 80} className="card p-8"><h3 className="text-2xl font-bold">{v.t}</h3><p className="mt-3 leading-relaxed text-charcoal/85">{v.d}</p></Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="container-x grid gap-10 py-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-5"><p className="eyebrow">What to expect</p><h2 className="display-lg mt-4">From request to drop-off.</h2></Reveal>
        <Reveal delay={100} className="lg:col-span-6 lg:col-start-7">
          <ul className="divide-y divide-forest/15 border-y border-forest/15">
            {EXPECT.map((e) => <li key={e} className="flex gap-4 py-5 text-lg"><span className="mt-1 font-bold text-sun" aria-hidden="true">✓</span>{e}</li>)}
          </ul>
          <Button to="/booking" variant="primary" size="lg" className="mt-8">Book your journey</Button>
        </Reveal>
      </section>
    </>
  );
}
