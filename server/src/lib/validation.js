const {
  MAX_TRIP_DAYS,
  isValidDateString,
  isValidTimeString,
  daysInclusive,
  nowInTimezone,
} = require('./dates');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Validates a public booking request. Returns { errors, value }.
 * `errors` is an object keyed by field name; empty when valid.
 * Everything is type-checked so objects (e.g. {"$gt": ""}) can never reach a query.
 */
function validateBookingInput(body = {}, { timeZone = 'UTC', now = new Date() } = {}) {
  const errors = {};
  const today = nowInTimezone(timeZone, now);

  const vehicle = str(body.vehicle);
  if (!/^[a-f0-9]{24}$/i.test(vehicle)) errors.vehicle = 'Please choose a vehicle.';

  const startLocation = str(body.startLocation);
  if (!startLocation) errors.startLocation = 'Tell us where the journey starts.';
  else if (startLocation.length > 160) errors.startLocation = 'Starting place is too long (160 characters max).';

  const stopsIn = Array.isArray(body.stops) ? body.stops : [];
  const stops = stopsIn.map(str).filter(Boolean);
  if (stops.length === 0) errors.stops = 'Add at least one destination or place you plan to visit.';
  else if (stops.length > 15) errors.stops = 'Please list 15 stops or fewer.';
  else if (stops.some((s) => s.length > 160)) errors.stops = 'Each stop must be 160 characters or fewer.';

  const startDate = str(body.startDate);
  const endDate = str(body.endDate);
  if (!isValidDateString(startDate)) errors.startDate = 'Enter a valid travel start date.';
  else if (startDate < today.date) errors.startDate = 'Start date cannot be in the past.';

  if (!isValidDateString(endDate)) errors.endDate = 'Enter a valid travel end date.';
  else if (isValidDateString(startDate) && endDate < startDate) errors.endDate = 'End date cannot be before the start date.';
  else if (isValidDateString(startDate) && daysInclusive(startDate, endDate) > MAX_TRIP_DAYS)
    errors.endDate = `Trips can be at most ${MAX_TRIP_DAYS} days. Contact us for longer hires.`;

  const startTime = str(body.startTime);
  if (!isValidTimeString(startTime)) errors.startTime = 'Enter a valid start time.';
  else if (startDate === today.date && startTime <= today.time) errors.startTime = 'Start time has already passed today.';

  const passengers = Number(body.passengers);
  if (!Number.isInteger(passengers) || passengers < 1) errors.passengers = 'Enter at least 1 passenger.';
  else if (passengers > 100) errors.passengers = 'Please contact us for groups this large.';

  const name = str(body.name);
  if (name.length < 2) errors.name = 'Please enter your full name.';
  else if (name.length > 100) errors.name = 'Name is too long.';

  const phone = str(body.phone);
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 7)
    errors.phone = 'Enter a valid phone number (digits, spaces, +, - and brackets only).';

  const email = str(body.email).toLowerCase();
  if (email && (!EMAIL_RE.test(email) || email.length > 160)) errors.email = 'Enter a valid email address.';

  const notes = str(body.notes);
  if (notes.length > 1000) errors.notes = 'Notes must be 1000 characters or fewer.';

  return {
    errors,
    value: {
      vehicle, startLocation, stops, startDate, endDate, startTime, passengers,
      customer: { name, phone, email }, notes,
    },
  };
}

function validateContactInput(body = {}) {
  const errors = {};
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const message = str(body.message);
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (message.length < 10) errors.message = 'Please write at least 10 characters.';
  else if (message.length > 2000) errors.message = 'Message must be 2000 characters or fewer.';
  return { errors, value: { name, email, message } };
}

function validateVehicleInput(body = {}) {
  const errors = {};
  const TYPES = ['sedan', 'suv', 'van', 'minibus', 'coach'];
  const AVAIL = ['available', 'maintenance', 'hidden'];
  const name = str(body.name);
  if (name.length < 2 || name.length > 80) errors.name = 'Name must be 2–80 characters.';
  const type = str(body.type);
  if (!TYPES.includes(type)) errors.type = 'Choose a vehicle type.';
  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) errors.capacity = 'Capacity must be a whole number from 1 to 100.';
  const luggage = body.luggage === '' || body.luggage == null ? 0 : Number(body.luggage);
  if (!Number.isInteger(luggage) || luggage < 0 || luggage > 100) errors.luggage = 'Luggage must be a whole number from 0 to 100.';
  const description = str(body.description);
  if (description.length < 10 || description.length > 1000) errors.description = 'Description must be 10–1000 characters.';
  const amenities = (Array.isArray(body.amenities) ? body.amenities : []).map(str).filter(Boolean).slice(0, 20);
  if (amenities.some((a) => a.length > 40)) errors.amenities = 'Each amenity must be 40 characters or fewer.';
  const availability = str(body.availability) || 'available';
  if (!AVAIL.includes(availability)) errors.availability = 'Invalid availability.';
  return { errors, value: { name, type, capacity, luggage, description, amenities, availability } };
}

module.exports = { validateBookingInput, validateContactInput, validateVehicleInput, EMAIL_RE };
