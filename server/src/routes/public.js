const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Vehicle, VehicleImage, TripGalleryPhoto, Booking, Feedback, TravelPackage, ContactMessage } = require('../models');
const { asyncHandler } = require('../middleware');
const { HttpError, AvailabilityError } = require('../lib/errors');
const { validateBookingInput, validateContactInput } = require('../lib/validation');
const { isValidDateString, isValidTimeString, nowInTimezone, MAX_TRIP_DAYS, daysInclusive } = require('../lib/dates');
const { checkAvailability, listBusyRanges, findConfirmedConflicts } = require('../services/availability');
const config = require('../config');

const router = express.Router();
const isId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v);
const historyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many booking history searches. Try again in 15 minutes.' },
});
const phoneLookup = (value) => {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return { digits, regex: new RegExp(`^\\D*${digits.split('').join('\\D*')}\\D*$`) };
};
const upcomingPackageQuery = () => {
  const now = nowInTimezone(config.timeZone);
  return {
    $and: [
      { endDate: { $gte: now.date } },
      { $or: [{ startDate: { $gt: now.date } }, { startDate: now.date, startTime: { $gt: now.time } }] },
    ],
  };
};

/** Attach images[] (primary first) to vehicle plain objects. */
async function withImages(vehicles) {
  const ids = vehicles.map((v) => v._id);
  const images = await VehicleImage.find({ vehicle: { $in: ids } })
    .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
    .select('url altText isPrimary vehicle')
    .lean();
  const byVehicle = new Map();
  images.forEach((img) => {
    const k = String(img.vehicle);
    if (!byVehicle.has(k)) byVehicle.set(k, []);
    byVehicle.get(k).push({ id: img._id, url: img.url, altText: img.altText, isPrimary: img.isPrimary });
  });
  return vehicles.map((v) => ({ ...v, images: byVehicle.get(String(v._id)) || [] }));
}

router.get(
  '/vehicles',
  asyncHandler(async (_req, res) => {
    const vehicles = await Vehicle.find({ availability: 'available' }).sort({ capacity: 1, name: 1 }).lean();
    res.json({ vehicles: await withImages(vehicles) });
  })
);

router.get(
  '/trip-photos',
  asyncHandler(async (_req, res) => {
    const photos = await TripGalleryPhoto.find()
      .populate('vehicle', 'name type')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ trips: photos.map((photo) => ({
      id: photo._id,
      vehicle: photo.vehicle ? { name: photo.vehicle.name, type: photo.vehicle.type } : null,
      destination: photo.destination,
      description: photo.description,
      url: photo.url,
      createdAt: photo.createdAt,
    })) });
  })
);

router.get(
  '/reviews',
  asyncHandler(async (_req, res) => {
    const rows = await Feedback.find()
      .populate({ path: 'booking', select: 'status vehicle', populate: { path: 'vehicle', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(9)
      .lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ reviews: rows
      .filter((item) => item.booking?.status === 'completed')
      .map((item) => ({
        rating: item.rating,
        comment: item.comment,
        vehicle: item.booking.vehicle?.name || null,
      })) });
  })
);

router.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    const packages = await TravelPackage.find(upcomingPackageQuery()).sort({ createdAt: -1 }).limit(6).lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ packages: packages.map((item) => ({
      id: item._id,
      title: item.title,
      destination: item.destination,
      startLocation: item.startLocation,
      startDate: item.startDate,
      endDate: item.endDate,
      startTime: item.startTime,
      endTime: item.endTime || '23:59',
      duration: item.duration,
      description: item.description,
      price: item.price,
    })) });
  })
);

router.get(
  '/packages/:id',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, 'Package not found.');
    const item = await TravelPackage.findOne({ _id: req.params.id, ...upcomingPackageQuery() }).lean();
    if (!item) throw new HttpError(404, 'This package is no longer available.');
    res.set('Cache-Control', 'no-store');
    res.json({ package: {
      id: item._id,
      title: item.title,
      destination: item.destination,
      startLocation: item.startLocation,
      startDate: item.startDate,
      endDate: item.endDate,
      startTime: item.startTime,
      endTime: item.endTime || '23:59',
      duration: item.duration,
      description: item.description,
      price: item.price,
    } });
  })
);

router.get(
  '/vehicles/:id',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, 'Vehicle not found.');
    const vehicle = await Vehicle.findOne({ _id: req.params.id, availability: { $ne: 'hidden' } }).lean();
    if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
    res.json({ vehicle: (await withImages([vehicle]))[0] });
  })
);

// Confirmed date ranges (no customer data) for drawing the calendar.
router.get(
  '/vehicles/:id/busy',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, 'Vehicle not found.');
    const today = nowInTimezone(config.timeZone).date;
    res.json({ busy: await listBusyRanges(req.params.id, today) });
  })
);

router.get(
  '/vehicles/:id/availability',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const startTime = req.query.startTime || '00:00';
    const endTime = req.query.endTime || '23:59';
    if (!isId(req.params.id)) throw new HttpError(404, 'Vehicle not found.');
    if (!isValidDateString(startDate) || !isValidDateString(endDate) || endDate < startDate)
      throw new HttpError(400, 'Provide valid startDate and endDate (YYYY-MM-DD).');
    if (!isValidTimeString(startTime) || !isValidTimeString(endTime) || (startDate === endDate && endTime <= startTime))
      throw new HttpError(400, 'Provide valid trip times; the end time must follow the start time for a same-day trip.');
    if (daysInclusive(startDate, endDate) > MAX_TRIP_DAYS) throw new HttpError(400, 'Date range is too long.');
    const vehicle = await Vehicle.findById(req.params.id).select('availability').lean();
    if (!vehicle || vehicle.availability !== 'available')
      return res.json({ available: false, reason: 'vehicle_unavailable', conflicts: [] });
    res.json(await checkAvailability(req.params.id, startDate, endDate, startTime, endTime));
  })
);

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newReference() {
  const bytes = crypto.randomBytes(6);
  return 'WF-' + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
}

const publicBooking = (b, vehicleName) => ({
  reference: b.reference,
  status: b.status,
  vehicle: vehicleName,
  startLocation: b.startLocation,
  stops: b.stops,
  startDate: b.startDate,
  endDate: b.endDate,
  startTime: b.startTime,
  endTime: b.endTime || '23:59',
  passengers: b.passengers,
  createdAt: b.createdAt,
});

// Customers can only REQUEST a booking. It is always created as "pending"; only an admin
// can confirm it (and confirmation re-checks availability atomically).
router.post(
  '/bookings',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    let selectedPackage = null;
    if (body.packageId !== undefined && body.packageId !== '') {
      if (typeof body.packageId !== 'string' || !isId(body.packageId)) throw new HttpError(400, 'Invalid package.');
      selectedPackage = await TravelPackage.findOne({ _id: body.packageId, ...upcomingPackageQuery() }).lean();
      if (!selectedPackage) throw new HttpError(409, 'This package is no longer available.');
    }
    const bookingInput = selectedPackage ? {
      ...body,
      startLocation: selectedPackage.startLocation,
      stops: [selectedPackage.destination],
      startDate: selectedPackage.startDate,
      endDate: selectedPackage.endDate,
      startTime: selectedPackage.startTime,
      endTime: selectedPackage.endTime || '23:59',
    } : body;
    const { errors, value } = validateBookingInput(bookingInput, { timeZone: config.timeZone });

    let vehicle = null;
    if (!errors.vehicle) {
      vehicle = await Vehicle.findById(value.vehicle).lean();
      if (!vehicle || vehicle.availability !== 'available') errors.vehicle = 'That vehicle is not available to book right now.';
      else if (!errors.passengers && value.passengers > vehicle.capacity)
        errors.passengers = `${vehicle.name} seats up to ${vehicle.capacity} passengers. Choose a larger vehicle or reduce the group size.`;
    }
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });

    const conflicts = await findConfirmedConflicts(vehicle._id, value.startDate, value.endDate, { startTime: value.startTime, endTime: value.endTime });
    if (conflicts.length) throw new AvailabilityError(conflicts.map((c) => ({ startDate: c.startDate, startTime: c.startTime, endDate: c.endDate, endTime: c.endTime || '23:59' })));

    let booking;
    for (let attempt = 0; attempt < 3 && !booking; attempt++) {
      try {
        booking = await Booking.create({
          ...value,
          package: selectedPackage ? selectedPackage._id : null,
          reference: newReference(),
          status: 'pending',
          statusHistory: [{ status: 'pending', by: 'customer' }],
        });
      } catch (err) {
        if (!(err.code === 11000 && attempt < 2)) throw err; // retry only on reference collision
      }
    }
    res.status(201).json({
      message: 'Request received. It is PENDING until our team confirms availability.',
      booking: publicBooking(booking, vehicle.name),
    });
  })
);

// Look up a request's status. Needs both the reference and the email used.
router.get(
  '/bookings/track',
  asyncHandler(async (req, res) => {
    const { reference, email } = req.query;
    if (typeof reference !== 'string' || typeof email !== 'string') throw new HttpError(400, 'Enter your reference and email.');
    const booking = await Booking.findOne({
      reference: reference.trim().toUpperCase(),
      'customer.email': email.trim().toLowerCase(),
    })
      .populate('vehicle', 'name')
      .lean();
    if (!booking) throw new HttpError(404, 'We could not find a request matching those details.');
    res.json({ booking: publicBooking(booking, booking.vehicle ? booking.vehicle.name : 'Vehicle') });
  })
);

// Find a customer's booking history by the phone number used at booking.
// Return trip summaries only; never expose customer contact details or notes.
router.get(
  '/bookings/history',
  historyLimiter,
  asyncHandler(async (req, res) => {
    const phone = typeof req.query.phone === 'string' ? req.query.phone : '';
    const lookup = phoneLookup(phone);
    if (!lookup) throw new HttpError(400, 'Enter the phone number used for your bookings.');
    const rows = await Booking.find({ 'customer.phone': { $regex: lookup.regex } })
      .populate('vehicle', 'name')
      .select('reference status vehicle startLocation stops startDate endDate startTime endTime passengers createdAt')
      .sort({ startDate: -1, createdAt: -1 })
      .lean();
    const today = nowInTimezone(config.timeZone).date;
    const feedback = rows.length ? await Feedback.find({ booking: { $in: rows.map((row) => row._id) } }).select('booking').lean() : [];
    const feedbackIds = new Set(feedback.map((item) => String(item.booking)));
    res.set('Cache-Control', 'no-store');
    res.json({ bookings: rows.map((booking) => ({
      ...publicBooking(booking, booking.vehicle ? booking.vehicle.name : 'Vehicle'),
      feedbackEligible: booking.status === 'completed' && booking.endDate <= today,
      feedbackSubmitted: feedbackIds.has(String(booking._id)),
    })) });
  })
);

router.post(
  '/feedback',
  historyLimiter,
  asyncHandler(async (req, res) => {
    const { reference, phone, rating, comment } = req.body || {};
    const lookup = phoneLookup(phone);
    if (typeof reference !== 'string' || !reference.trim() || !lookup)
      throw new HttpError(400, 'Enter the booking reference and phone number used for the trip.');
    const score = Number(rating);
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new HttpError(422, 'Choose a rating from 1 to 5.');
    if (typeof comment !== 'string' || comment.trim().length < 3 || comment.trim().length > 2000)
      throw new HttpError(422, 'Write feedback between 3 and 2000 characters.');
    const booking = await Booking.findOne({
      reference: reference.trim().toUpperCase(),
      'customer.phone': { $regex: lookup.regex },
    }).select('_id status endDate');
    if (!booking) throw new HttpError(404, 'We could not find a booking matching those details.');
    if (booking.status !== 'completed' || booking.endDate > nowInTimezone(config.timeZone).date)
      throw new HttpError(409, 'Feedback is available after a completed trip has ended.');
    try {
      await Feedback.create({ booking: booking._id, rating: score, comment: comment.trim() });
    } catch (err) {
      if (err.code === 11000) throw new HttpError(409, 'Feedback has already been submitted for this trip.');
      throw err;
    }
    res.status(201).json({ message: 'Thank you for sharing feedback about your trip.' });
  })
);

router.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const { errors, value } = validateContactInput(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });
    await ContactMessage.create(value);
    res.status(201).json({ message: 'Thanks - your message has been received.' });
  })
);

module.exports = router;
