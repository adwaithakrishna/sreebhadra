import { Link } from 'react-router-dom';
import { SITE } from '../lib/site';

/** Logo placeholder: swap the SVG mark / wordmark for the real brand. */
export default function Logo({ light = false, to = '/', large = false }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight ${light ? 'text-ivory' : 'text-forest'}`} aria-label={`${SITE.name} home`}>
     <img
      src="/sreebhadra_logo.png"
      alt=""
       className={`${large ? 'h-11' : 'h-10'} w-auto object-contain`}
    />
      {SITE.name}
    </Link>
  );
}
