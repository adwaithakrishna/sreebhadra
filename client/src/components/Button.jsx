import { Link } from 'react-router-dom';

const VARIANTS = {
  // Amber + forest text = ~7:1 contrast. Reserved for booking actions.
  primary: 'bg-sun text-forest hover:bg-sun-600 shadow-[0_6px_0_-2px_rgba(23,60,50,.25)] hover:shadow-[0_3px_0_-1px_rgba(23,60,50,.25)] hover:translate-y-[2px]',
  dark: 'bg-forest text-ivory hover:bg-forest-800',
  outline: 'border-2 border-forest text-forest hover:bg-forest hover:text-ivory',
  light: 'border-2 border-ivory/70 text-ivory hover:bg-ivory hover:text-forest',
  ghost: 'text-forest hover:bg-forest/10',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};
const SIZES = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };

export default function Button({ variant = 'dark', size = 'md', to, href, className = '', loading = false, children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return (
    <button type="button" className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}
