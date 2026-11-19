import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';
import { IconMenu, IconX } from './Icons';
import { NAV } from '../lib/site';

const linkCls = ({ isActive }) =>
  `relative py-2 text-[15px] font-medium text-ivory/90 transition hover:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-sun after:transition-transform hover:after:scale-x-100 ${isActive ? 'text-white after:scale-x-100' : ''}`;

export default function Header({ brandHidden = false }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-forest shadow-[0_1px_0_rgba(255,255,255,.08)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sun focus:px-4 focus:py-2 focus:font-bold focus:text-forest">Skip to content</a>
      <div className="container-x flex h-[72px] items-center justify-between">
       <div
  data-site-logo
  className={brandHidden ? 'invisible' : 'visible'}
>
  <Logo light />
</div>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>
          ))}
          <Button to="/booking" variant="primary" size="sm">Book your journey</Button>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:bg-white/10 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <IconX size={24} /> : <IconMenu size={24} />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="animate-fade border-t border-white/10 bg-forest md:hidden">
          <div className="container-x flex flex-col py-4">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `border-b border-white/10 py-4 font-display text-3xl font-bold ${isActive ? 'text-sun' : 'text-ivory'}`}>{n.label}</NavLink>
            ))}
            <Button to="/booking" variant="primary" size="lg" className="mt-6">Book your journey</Button>
          </div>
        </nav>
      )}
    </header>
  );
}
