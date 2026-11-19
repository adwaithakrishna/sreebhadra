import { Link } from 'react-router-dom';
import Logo from './Logo';
import { NAV, SITE } from '../lib/site';
import { IconMail, IconPhone, IconPin } from './Icons';

export default function Footer() {
  return (
    <footer className="bg-forest text-ivory">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo light />
          <p className="mt-6 max-w-sm font-display text-3xl font-bold leading-tight text-ivory">{SITE.tagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="eyebrow !text-sage">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="text-ivory/90 underline-offset-4 hover:text-sun hover:underline">{n.label}</Link></li>
            ))}
            <li><Link to="/admin" className="text-ivory/60 underline-offset-4 hover:text-sun hover:underline">Staff sign-in</Link></li>
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="eyebrow !text-sage">Contact</h2>
          <ul className="mt-4 space-y-3 text-ivory/90">
            <li className="flex gap-3"><IconPhone className="mt-0.5 shrink-0 text-sun" />{SITE.phone}</li>
            <li className="flex gap-3"><IconMail className="mt-0.5 shrink-0 text-sun" />{SITE.email}</li>
            <li className="flex gap-3"><IconPin className="mt-0.5 shrink-0 text-sun" />{SITE.serviceArea}</li>
          </ul>
          <ul className="mt-6 flex flex-wrap gap-3" aria-label="Social links">
            {SITE.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer noopener" className="inline-flex rounded-full border border-sage/60 px-4 py-2 text-sm font-medium text-ivory transition hover:border-sun hover:bg-sun hover:text-forest">
                  {s.label}<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-sm text-sage sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. Placeholder brand and contact details.</p>
          <p>Booking requests are confirmed by our team - never automatically.</p>
        </div>
      </div>
    </footer>
  );
}
