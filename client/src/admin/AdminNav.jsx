import { NavLink } from 'react-router-dom';
import { IconCalendar, IconCar, IconGrid, IconList, IconPlus, IconRoute, IconStar } from '../components/Icons';

const ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: IconList },
  { to: '/admin/bookings/new', label: 'Add booking', icon: IconPlus },
  { to: '/admin/schedule', label: 'Schedule', icon: IconCalendar },
  { to: '/admin/vehicles', label: 'Vehicles', icon: IconCar },
  { to: '/admin/trips', label: 'Trip gallery', icon: IconRoute },
  { to: '/admin/feedback', label: 'Feedback', icon: IconStar },
  { to: '/admin/packages', label: 'Packages', icon: IconRoute },
];

export default function AdminNav({ onNavigate, className = '' }) {
  return (
    <nav aria-label="Admin" className={className}>
      <ul className="space-y-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${isActive ? 'bg-sun text-forest' : 'text-ivory/90 hover:bg-white/10'}`}>
              <Icon size={20} />{label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
