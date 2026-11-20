const { Booking, BookingLock } = require('../models');
const { AvailabilityError, HttpError } = require('../lib/errors');
const { canTransition } = require('../lib/status');
const { nowInTimezone } = require('../lib/dates');
const config = require('../config');

const dateTimeMs = (date, time) => Date.parse(`${date}T${time}:00.000Z`);

/** Return 15-minute lock keys touched by a half-open trip interval. */
function enumerateTimeSlots(startDate, startTime, endDate, endTime) {
  const slotMs = 15 * 60 * 1000;
  const start = dateTimeMs(startDate, startTime);
  const end = dateTimeMs(endDate, endTime);
  const first = Math.floor(start / slotMs);
  const lastExclusive = Math.ceil(end / slotMs);
  const slots = [];
  for (let slot = first; slot < lastExclusive; slot++) {
    const slotStart = new Date(slot * slotMs).toISOString();
    slots.push(`${slotStart.slice(0, 10)}T${slotStart.slice(11, 16)}`);
  }
  return slots;
}

/** Find confirmed trips whose actual start/end times overlap the requested interval. */
async function findConfirmedConflicts(vehicleId, startDate, endDate, { startTime = '00:00', endTime = '23:59', excludeBookingId } = {}) {
  const query = {
    vehicle: vehicleId,
    status: 'confirmed',
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const rows = await Booking.find(query).select('startDate startTime endDate endTime').sort({ startDate: 1 }).lean();
  const requestedStart = dateTimeMs(startDate, startTime);
  const requestedEnd = dateTimeMs(endDate, endTime);
  return rows.filter((row) => {
    const existingStart = dateTimeMs(row.startDate, row.startTime || '00:00');
    const existingEnd = dateTimeMs(row.endDate, row.endTime || '23:59');
    return requestedStart < existingEnd && existingStart < requestedEnd;
  });
}

/** Public-safe availability answer. Never exposes customer data. */
async function checkAvailability(vehicleId, startDate, endDate, startTime = '00:00', endTime = '23:59') {
  const conflicts = await findConfirmedConflicts(vehicleId, startDate, endDate, { startTime, endTime });
  return {
    available: conflicts.length === 0,
    conflicts: conflicts.map((c) => ({ startDate: c.startDate, startTime: c.startTime, endDate: c.endDate, endTime: c.endTime || '23:59' })),
  };
}

/** All upcoming confirmed ranges for a vehicle (for the booking calendar). */
async function listBusyRanges(vehicleId, fromDate) {
  const rows = await Booking.find({ vehicle: vehicleId, status: 'confirmed', endDate: { $gte: fromDate } })
    .select('startDate startTime endDate endTime')
    .sort({ startDate: 1 })
    .lean();
  return rows.map((r) => ({ startDate: r.startDate, startTime: r.startTime || '00:00', endDate: r.endDate, endTime: r.endTime || '23:59' }));
}

/**
 * Atomically confirm a pending booking.
 *
 * 1. Friendly pre-check against other confirmed bookings (gives useful conflict dates).
 * 2. Claim one BookingLock per 15-minute time slot. The unique (vehicle, day) index prevents
 *    simultaneous confirmations from claiming overlapping time intervals.
 * 3. Flip status pending -> confirmed with a conditional update (so a concurrent
 *    reject/cancel is respected). If that fails, locks are released.
 */
async function confirmBooking(bookingId, adminLabel = 'admin') {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new HttpError(404, 'Booking not found.');
  if (booking.status === 'confirmed') return booking; // idempotent
  if (!canTransition(booking.status, 'confirmed'))
    throw new HttpError(409, `A ${booking.status} booking cannot be confirmed.`);

  const range = { startTime: booking.startTime, endTime: booking.endTime || '23:59', excludeBookingId: booking._id };
  const conflicts = await findConfirmedConflicts(booking.vehicle, booking.startDate, booking.endDate, range);
  if (conflicts.length) throw new AvailabilityError(conflicts.map((c) => ({ startDate: c.startDate, startTime: c.startTime, endDate: c.endDate, endTime: c.endTime || '23:59' })));

  const slots = enumerateTimeSlots(booking.startDate, booking.startTime, booking.endDate, booking.endTime || '23:59');
  try {
    await BookingLock.insertMany(
      slots.map((day) => ({ vehicle: booking.vehicle, day, booking: booking._id })),
      { ordered: true }
    );
  } catch (err) {
    await BookingLock.deleteMany({ booking: booking._id });
    if (err && (err.code === 11000 || err.writeErrors)) {
      const fresh = await findConfirmedConflicts(booking.vehicle, booking.startDate, booking.endDate, range);
      throw new AvailabilityError(fresh.map((c) => ({ startDate: c.startDate, startTime: c.startTime, endDate: c.endDate, endTime: c.endTime || '23:59' })));
    }
    throw err;
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'pending' },
    { $set: { status: 'confirmed' }, $push: { statusHistory: { status: 'confirmed', by: adminLabel } } },
    { new: true }
  );
  if (!updated) {
    await BookingLock.deleteMany({ booking: booking._id });
    throw new HttpError(409, 'This booking changed while you were confirming it. Refresh and try again.');
  }
  return updated;
}

/** Move a booking to a non-confirmed status and release its date locks where appropriate. */
async function changeStatus(bookingId, nextStatus, adminLabel = 'admin') {
  if (nextStatus === 'confirmed') return confirmBooking(bookingId, adminLabel);

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new HttpError(404, 'Booking not found.');
  if (!canTransition(booking.status, nextStatus))
    throw new HttpError(409, `A ${booking.status} booking cannot be marked ${nextStatus}.`);

  if (nextStatus === 'completed' && booking.startDate > nowInTimezone(config.timeZone).date)
    throw new HttpError(409, 'A journey can only be marked completed once its start date has arrived.');

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    { $set: { status: nextStatus }, $push: { statusHistory: { status: nextStatus, by: adminLabel } } },
    { new: true }
  );
  if (!updated) throw new HttpError(409, 'This booking changed while you were updating it. Refresh and try again.');

  // Cancelling frees the dates. Completed bookings keep their locks (history of use).
  if (nextStatus === 'cancelled' || nextStatus === 'rejected') await BookingLock.deleteMany({ booking: booking._id });
  return updated;
}

/** Safety net: drop locks whose booking is not confirmed/completed (e.g. after a crash mid-confirm). */
async function reconcileLocks() {
  const lockedIds = await BookingLock.distinct('booking');
  if (!lockedIds.length) return 0;
  const good = await Booking.find({ _id: { $in: lockedIds }, status: { $in: ['confirmed', 'completed'] } })
    .select('_id')
    .lean();
  const goodSet = new Set(good.map((b) => String(b._id)));
  const orphans = lockedIds.filter((id) => !goodSet.has(String(id)));
  if (orphans.length) await BookingLock.deleteMany({ booking: { $in: orphans } });
  return orphans.length;
}

module.exports = { findConfirmedConflicts, checkAvailability, listBusyRanges, confirmBooking, changeStatus, reconcileLocks };
