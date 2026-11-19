import Button from './Button';
import VehicleMedia from './VehicleMedia';
import { IconBag, IconUsers } from './Icons';
import { TYPE_LABEL } from '../lib/format';

export default function VehicleCard({ vehicle, onView, className = '' }) {
  const image = vehicle.images?.[0];
  return (
    <article className={`group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(23,60,50,.45)] ${className}`}>
      <button
        type="button"
        onClick={() => onView?.(vehicle)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-sage-100 text-left"
        aria-label={`View details for ${vehicle.name}`}
        tabIndex={onView ? 0 : -1}
        disabled={!onView}
      >
        <span className="block h-full w-full transition duration-700 group-hover:scale-105">
          <VehicleMedia vehicle={vehicle} image={image} />
        </span>
        <span className="absolute left-4 top-4 rounded-full bg-ivory/95 px-3 py-1 text-xs font-bold uppercase tracking-widest text-forest">{TYPE_LABEL[vehicle.type]}</span>
      </button>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-extrabold leading-tight">{vehicle.name}</h3>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-charcoal/80">
          <li className="flex items-center gap-1.5"><IconUsers size={18} className="text-forest" />Up to {vehicle.capacity} passengers</li>
          {vehicle.luggage > 0 && <li className="flex items-center gap-1.5"><IconBag size={18} className="text-forest" />{vehicle.luggage} bags</li>}
        </ul>
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-charcoal/85">{vehicle.description}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          {onView && <Button variant="outline" size="sm" onClick={() => onView(vehicle)}>View details</Button>}
        </div>
      </div>
    </article>
  );
}
