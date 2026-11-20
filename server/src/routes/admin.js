const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { AdminUser, Vehicle, VehicleImage, TripGalleryPhoto, Booking, BookingLock, Feedback, TravelPackage } = require('../models');
const { asyncHandler, requireAdmin, signAdminToken, COOKIE, cookieOptions } = require('../middleware');
const { HttpError, AvailabilityError } = require('../lib/errors');
const { STATUSES } = require('../lib/status');
const { validateVehicleInput, validateBookingInput } = require('../lib/validation');
const { isValidDateString, isValidTimeString, nowInTimezone } = require('../lib/dates');
const { changeStatus, findConfirmedConflicts } = require('../services/availability');
const { saveImage, deleteImage } = require('../services/storage');
const config = require('../config');

const router = express.Router();
const isId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v);
const needId = (id, what = 'Item') => {
  if (!isId(id)) throw new HttpError(404, `${what} not found.`);
};
const upload = multer({
  storage: multer.memoryStorage(), // buffered briefly, then handed to disk/Cloudinary - never stored in MongoDB
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

/* ------------------------------------ auth ----------------------------------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

// A real hash to compare against when the email is unknown, so timing doesn't reveal accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') throw new HttpError(400, 'Enter your email and password.');
    const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    const ok = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY_HASH);
    if (!admin || !ok) throw new HttpError(401, 'Incorrect email or password.');
    admin.lastLoginAt = new Date();
    await admin.save();
    res.cookie(COOKIE, signAdminToken(admin), cookieOptions);
    res.json({ admin: { email: admin.email, name: admin.name } });
  })
);

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

// Everything below requires a valid admin session.
router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ admin: { email: req.admin.email, name: req.admin.name } }));

/* ------------------------------- packages ----------------------------------- */
const packageView = (item) => ({
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
  createdAt: item.createdAt,
});

router.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    const packages = await TravelPackage.find().sort({ createdAt: -1 }).lean();
    res.json({ packages: packages.map(packageView) });
  })
);

router.post(
  '/packages',
  asyncHandler(async (req, res) => {
    const { title, destination, startLocation, startDate, endDate, startTime, endTime, duration = '', description, price = '' } = req.body || {};
    if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 80)
      throw new HttpError(422, 'Package title must be 2 to 80 characters.');
    if (typeof destination !== 'string' || destination.trim().length < 2 || destination.trim().length > 160)
      throw new HttpError(422, 'Destination must be 2 to 160 characters.');
    if (typeof startLocation !== 'string' || startLocation.trim().length < 2 || startLocation.trim().length > 160)
      throw new HttpError(422, 'Starting place must be 2 to 160 characters.');
    const today = nowInTimezone(config.timeZone);
    if (!isValidDateString(startDate) || startDate < today.date) throw new HttpError(422, 'Choose a valid package start date today or later.');
    if (!isValidDateString(endDate) || endDate < startDate) throw new HttpError(422, 'End date must be on or after the start date.');
    if (!isValidTimeString(startTime)) throw new HttpError(422, 'Choose a valid departure time.');
    if (!isValidTimeString(endTime) || (startDate === endDate && endTime <= startTime)) throw new HttpError(422, 'Choose a valid end time after the departure time.');
    if (startDate === today.date && startTime <= today.time) throw new HttpError(422, 'Departure time has already passed today.');
    if (typeof duration !== 'string' || duration.trim().length > 80)
      throw new HttpError(422, 'Duration must be 80 characters or fewer.');
    if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000)
      throw new HttpError(422, 'Description must be 10 to 1000 characters.');
    if (typeof price !== 'string' || price.trim().length > 80)
      throw new HttpError(422, 'Price must be 80 characters or fewer.');
    const item = await TravelPackage.create({
      title: title.trim(), destination: destination.trim(), startLocation: startLocation.trim(),
      startDate, endDate, startTime, endTime, duration: duration.trim(),
      description: description.trim(), price: price.trim(),
    });
    res.status(201).json({ package: packageView(item.toObject()) });
  })
);

router.delete(
  '/packages/:id',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Package');
    const item = await TravelPackage.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, 'Package not found.');
    res.json({ ok: true });
  })
);

router.get(
  '/feedback',
  asyncHandler(async (_req, res) => {
    const rows = await Feedback.find()
      .populate({ path: 'booking', select: 'reference startDate endDate customer vehicle', populate: { path: 'vehicle', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ feedback: rows.map((item) => ({
      id: item._id,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
      booking: item.booking ? {
        reference: item.booking.reference,
        customer: item.booking.customer?.name,
        vehicle: item.booking.vehicle?.name || 'Vehicle',
        startDate: item.booking.startDate,
        endDate: item.booking.endDate,
      } : null,
    })) });
  })
);

/* ------------------------------ trip gallery -------------------------------- */
const tripPhotoView = (photo) => ({
  id: photo._id,
  vehicle: photo.vehicle && photo.vehicle._id ? { id: photo.vehicle._id, name: photo.vehicle.name, type: photo.vehicle.type } : photo.vehicle,
  destination: photo.destination,
  description: photo.description,
  url: photo.url,
  createdAt: photo.createdAt,
});

router.get(
  '/trips',
  asyncHandler(async (_req, res) => {
    const photos = await TripGalleryPhoto.find().populate('vehicle', 'name type').sort({ createdAt: -1 }).lean();
    res.json({ trips: photos.map(tripPhotoView) });
  })
);

router.post(
  '/trips',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, destination, description } = req.body || {};
    if (typeof vehicleId !== 'string' || !isId(vehicleId)) throw new HttpError(422, 'Choose a valid vehicle.');
    if (typeof destination !== 'string' || !destination.trim() || destination.trim().length > 160)
      throw new HttpError(422, 'Enter a destination (up to 160 characters).');
    if (typeof description !== 'string' || description.trim().length < 3 || description.trim().length > 1000)
      throw new HttpError(422, 'Enter a trip description between 3 and 1000 characters.');
    if (!req.file) throw new HttpError(422, 'Choose a trip photo.');
    const vehicle = await Vehicle.findById(vehicleId).select('_id name type').lean();
    if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
    const stored = await saveImage(req.file.buffer);
    const photo = await TripGalleryPhoto.create({
      vehicle: vehicle._id,
      destination: destination.trim(),
      description: description.trim(),
      ...stored,
    });
    res.status(201).json({ trip: tripPhotoView({ ...photo.toObject(), vehicle }) });
  })
);

router.delete(
  '/trips/:id',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Trip photo');
    const photo = await TripGalleryPhoto.findByIdAndDelete(req.params.id);
    if (!photo) throw new HttpError(404, 'Trip photo not found.');
    await deleteImage(photo);
    res.json({ ok: true });
  })
);

/* ----------------------------------- stats ----------------------------------- */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const today = nowInTimezone(config.timeZone).date;
    const [total, pending, confirmed, upcoming, vehicles] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'confirmed', endDate: { $gte: today } }),
      Vehicle.countDocuments(),
    ]);
    res.json({ total, pending, confirmed, upcoming, vehicles });
  })
);

/* --------------------------------- bookings ---------------------------------- */
const bookingView = (b) => ({
  id: b._id,
  reference: b.reference,
  status: b.status,
  vehicle: b.vehicle && b.vehicle._id ? { id: b.vehicle._id, name: b.vehicle.name, type: b.vehicle.type, capacity: b.vehicle.capacity } : null,
  startLocation: b.startLocation,
  stops: b.stops,
  startDate: b.startDate,
  endDate: b.endDate,
  startTime: b.startTime,
  endTime: b.endTime || '23:59',
  passengers: b.passengers,
  customer: b.customer,
  notes: b.notes,
  statusHistory: b.statusHistory,
  createdAt: b.createdAt,
});

router.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const q = {};
    if (typeof req.query.status === 'string' && STATUSES.includes(req.query.status)) q.status = req.query.status;
    if (isId(req.query.vehicle)) q.vehicle = req.query.vehicle;
    const rows = await Booking.find(q).populate('vehicle', 'name type capacity').sort({ createdAt: -1 }).limit(500).lean();
    res.json({ bookings: rows.map(bookingView) });
  })
);

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newBookingReference() {
  const bytes = crypto.randomBytes(6);
  return 'WF-' + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
}

// Staff can record a booking made by phone or in person. It remains pending until
// an admin confirms it, and confirmation performs the normal atomic availability check.
router.post(
  '/bookings',
  asyncHandler(async (req, res) => {
    const { errors, value } = validateBookingInput(req.body || {}, { timeZone: config.timeZone });
    let vehicle = null;
    if (!errors.vehicle) {
      vehicle = await Vehicle.findById(value.vehicle).lean();
      if (!vehicle || vehicle.availability !== 'available') errors.vehicle = 'That vehicle is not available to book right now.';
      else if (!errors.passengers && value.passengers > vehicle.capacity)
        errors.passengers = `${vehicle.name} seats up to ${vehicle.capacity} passengers.`;
    }
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });

    const conflicts = await findConfirmedConflicts(vehicle._id, value.startDate, value.endDate, { startTime: value.startTime, endTime: value.endTime });
    if (conflicts.length) throw new AvailabilityError(conflicts.map((item) => ({ startDate: item.startDate, startTime: item.startTime, endDate: item.endDate, endTime: item.endTime || '23:59' })));

    let booking;
    for (let attempt = 0; attempt < 3 && !booking; attempt++) {
      try {
        booking = await Booking.create({
          ...value,
          package: null,
          reference: newBookingReference(),
          status: 'pending',
          statusHistory: [{ status: 'pending', by: req.admin.email }],
        });
      } catch (err) {
        if (!(err.code === 11000 && attempt < 2)) throw err;
      }
    }
    const saved = await Booking.findById(booking._id).populate('vehicle', 'name type capacity').lean();
    res.status(201).json({ booking: bookingView(saved) });
  })
);

router.get(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Booking');
    const b = await Booking.findById(req.params.id).populate('vehicle', 'name type capacity').lean();
    if (!b) throw new HttpError(404, 'Booking not found.');
    res.json({ booking: bookingView(b) });
  })
);

router.patch(
  '/bookings/:id/status',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Booking');
    const { status } = req.body || {};
    if (typeof status !== 'string' || !STATUSES.includes(status) || status === 'pending') throw new HttpError(400, 'Invalid status.');
    await changeStatus(req.params.id, status, req.admin.email);
    const b = await Booking.findById(req.params.id).populate('vehicle', 'name type capacity').lean();
    res.json({ booking: bookingView(b) });
  })
);

/* --------------------------------- vehicles ---------------------------------- */
async function vehicleWithImages(v) {
  const images = await VehicleImage.find({ vehicle: v._id }).sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 }).lean();
  return {
    ...v,
    images: images.map((i) => ({ id: i._id, url: i.url, altText: i.altText, isPrimary: i.isPrimary })),
  };
}

router.get(
  '/vehicles',
  asyncHandler(async (_req, res) => {
    const vehicles = await Vehicle.find().sort({ createdAt: 1 }).lean();
    res.json({ vehicles: await Promise.all(vehicles.map(vehicleWithImages)) });
  })
);

router.post(
  '/vehicles',
  asyncHandler(async (req, res) => {
    const { errors, value } = validateVehicleInput(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });
    const v = await Vehicle.create(value);
    res.status(201).json({ vehicle: await vehicleWithImages(v.toObject()) });
  })
);

router.put(
  '/vehicles/:id',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Vehicle');
    const { errors, value } = validateVehicleInput(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });
    const v = await Vehicle.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true }).lean();
    if (!v) throw new HttpError(404, 'Vehicle not found.');
    res.json({ vehicle: await vehicleWithImages(v) });
  })
);

router.delete(
  '/vehicles/:id',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Vehicle');
    const inUse = await Booking.countDocuments({ vehicle: req.params.id, status: { $in: ['pending', 'confirmed'] } });
    if (inUse) throw new HttpError(409, `This vehicle has ${inUse} pending/confirmed booking(s). Resolve them first, or set the vehicle to "hidden" instead.`);
    const images = await VehicleImage.find({ vehicle: req.params.id });
    await Promise.all(images.map(deleteImage));
    await VehicleImage.deleteMany({ vehicle: req.params.id });
    await BookingLock.deleteMany({ vehicle: req.params.id });
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

/* ---------------------------------- images ----------------------------------- */
router.post(
  '/vehicles/:id/images',
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Vehicle');
    const vehicle = await Vehicle.findById(req.params.id).select('_id').lean();
    if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
    const files = req.files || [];
    if (!files.length) throw new HttpError(422, 'Choose at least one image.');

    const raw = req.body.altTexts;
    const alts = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    for (let i = 0; i < files.length; i++) {
      if (typeof alts[i] !== 'string' || alts[i].trim().length < 3)
        throw new HttpError(422, `Add a short description (alt text, at least 3 characters) for "${files[i].originalname}".`);
    }

    const existing = await VehicleImage.countDocuments({ vehicle: vehicle._id });
    const created = [];
    for (let i = 0; i < files.length; i++) {
      const stored = await saveImage(files[i].buffer);
      created.push(
        await VehicleImage.create({
          vehicle: vehicle._id,
          ...stored,
          altText: alts[i].trim().slice(0, 200),
          isPrimary: existing === 0 && i === 0,
          sortOrder: existing + i,
        })
      );
    }
    res.status(201).json({ images: created.map((i) => ({ id: i._id, url: i.url, altText: i.altText, isPrimary: i.isPrimary })) });
  })
);

router.patch(
  '/vehicles/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Vehicle');
    needId(req.params.imageId, 'Image');
    const img = await VehicleImage.findOne({ _id: req.params.imageId, vehicle: req.params.id });
    if (!img) throw new HttpError(404, 'Image not found.');
    const { altText, isPrimary } = req.body || {};
    if (altText !== undefined) {
      if (typeof altText !== 'string' || altText.trim().length < 3) throw new HttpError(422, 'Description must be at least 3 characters.');
      img.altText = altText.trim().slice(0, 200);
    }
    if (isPrimary === true) {
      await VehicleImage.updateMany({ vehicle: req.params.id }, { isPrimary: false });
      img.isPrimary = true;
    }
    await img.save();
    res.json({ image: { id: img._id, url: img.url, altText: img.altText, isPrimary: img.isPrimary } });
  })
);

router.delete(
  '/vehicles/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    needId(req.params.id, 'Vehicle');
    needId(req.params.imageId, 'Image');
    const img = await VehicleImage.findOneAndDelete({ _id: req.params.imageId, vehicle: req.params.id });
    if (!img) throw new HttpError(404, 'Image not found.');
    await deleteImage(img);
    if (img.isPrimary) {
      const next = await VehicleImage.findOne({ vehicle: req.params.id }).sort({ sortOrder: 1 });
      if (next) await VehicleImage.updateOne({ _id: next._id }, { isPrimary: true });
    }
    res.json({ ok: true });
  })
);

module.exports = router;
