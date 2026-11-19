// Mirrors server/src/lib/validation.js so users get instant feedback. The server remains the
// authority - never rely on this for correctness.
import { daysBetween, nowHHMM, todayISO } from './format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
export const MAX_TRIP_DAYS = 60;

export function validateBooking(v, vehicle) {
  const e = {};
  const today = todayISO();
  if (!v.vehicle) e.vehicle = 'Please choose a vehicle.';
  if (!v.startLocation.trim()) e.startLocation = 'Tell us where the journey starts.';
  const stops = v.stops.map((s) => s.trim()).filter(Boolean);
  if (!stops.length) e.stops = 'Add at least one destination or place you plan to visit.';

  if (!v.startDate) e.startDate = 'Choose your travel start date.';
  else if (v.startDate < today) e.startDate = 'Start date cannot be in the past.';

  if (!v.endDate) e.endDate = 'Choose your travel end date.';
  else if (v.startDate && v.endDate < v.startDate) e.endDate = 'End date cannot be before the start date.';
  else if (v.startDate && daysBetween(v.startDate, v.endDate) > MAX_TRIP_DAYS)
    e.endDate = `Trips can be at most ${MAX_TRIP_DAYS} days. Contact us for longer hires.`;

  if (!v.startTime) e.startTime = 'Choose a start time.';
  else if (v.startDate === today && v.startTime <= nowHHMM()) e.startTime = 'That time has already passed today.';

  const pax = Number(v.passengers);
  if (!v.passengers || !Number.isInteger(pax) || pax < 1) e.passengers = 'Enter at least 1 passenger.';
  else if (vehicle && pax > vehicle.capacity) e.passengers = `${vehicle.name} seats up to ${vehicle.capacity}. Reduce the group or pick a larger vehicle.`;

  if (v.name.trim().length < 2) e.name = 'Please enter your full name.';
  if (!PHONE_RE.test(v.phone.trim()) || v.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number, e.g. +00 000 000 0000.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.notes.length > 1000) e.notes = 'Notes must be 1000 characters or fewer.';
  return e;
}

export function validateContact(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
  return e;
}
