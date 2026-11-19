import { useState } from 'react';
import VehicleArt from './VehicleArt';

/** Shows an uploaded photo if there is one (with its alt text); otherwise the illustrated placeholder. */
export default function VehicleMedia({ vehicle, image, className = 'h-full w-full object-cover', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (image?.url && !failed) {
    return <img src={image.url} alt={image.altText || vehicle.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} className={className} />;
  }
  return (
    <VehicleArt
      type={vehicle.type}
      seed={vehicle.name.length}
      className={className}
      label={`${vehicle.name}, ${vehicle.type} seating ${vehicle.capacity} (illustrated placeholder - no photo uploaded yet)`}
    />
  );
}
