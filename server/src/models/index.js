const mongoose = require('mongoose');
const { Schema } = mongoose;
const { STATUSES } = require('../lib/status');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ---------------------------------- Vehicle --------------------------------- */
const vehicleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, required: true, enum: ['sedan', 'suv', 'van', 'minibus', 'coach'] },
    capacity: { type: Number, required: true, min: 1, max: 100 },
    luggage: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    amenities: { type: [String], default: [] },
    // available = bookable & public, maintenance = visible but not bookable, hidden = not public
    availability: { type: String, enum: ['available', 'maintenance', 'hidden'], default: 'available', index: true },
  },
  { timestamps: true }
);

/* ------------------------------- VehicleImage ------------------------------- */
// Only the URL + metadata live in MongoDB; the file itself is in local disk/Cloudinary.
const vehicleImageSchema = new Schema(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    url: { type: String, required: true },
    storageKey: { type: String, required: true }, // filename or Cloudinary public_id, for deletion
    storageDriver: { type: String, enum: ['local', 'cloudinary'], required: true },
    altText: { type: String, required: true, trim: true, maxlength: 200 },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ------------------------------ TripGalleryPhoto ----------------------------- */
const tripGalleryPhotoSchema = new Schema(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    destination: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    url: { type: String, required: true },
    storageKey: { type: String, required: true },
    storageDriver: { type: String, enum: ['local', 'cloudinary'], required: true },
  },
  { timestamps: true }
);

/* ---------------------------------- Booking --------------------------------- */
const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    package: { type: Schema.Types.ObjectId, ref: 'TravelPackage', default: null },
    startLocation: { type: String, required: true, trim: true, maxlength: 160 },
    stops: { type: [String], validate: (v) => v.length >= 1 },
    // Stored as YYYY-MM-DD strings: no timezone drift, lexicographic order == date order.
    startDate: { type: String, required: true, match: DATE_RE },
    endDate: { type: String, required: true, match: DATE_RE },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, default: '23:59', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    passengers: { type: Number, required: true, min: 1 },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
    },
    notes: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: String, default: 'customer' },
      },
    ],
  },
  { timestamps: true }
);
bookingSchema.index({ vehicle: 1, status: 1, startDate: 1, endDate: 1 });

/* -------------------------------- BookingLock -------------------------------- */
// One document per vehicle per day for every CONFIRMED booking. The unique index on
// (vehicle, day) is what makes double-booking impossible even when two admins confirm
// overlapping requests at the same instant: the database rejects the second insert.
// Works on a standalone MongoDB (no replica set / transactions needed).
const bookingLockSchema = new Schema({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  day: { type: String, required: true, maxlength: 24 },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
});
bookingLockSchema.index({ vehicle: 1, day: 1 }, { unique: true });

/* --------------------------------- Feedback --------------------------------- */
const feedbackSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

/* ------------------------------- TravelPackage ------------------------------- */
const travelPackageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    destination: { type: String, required: true, trim: true, maxlength: 160 },
    startLocation: { type: String, required: true, trim: true, maxlength: 160 },
    startDate: { type: String, required: true, match: DATE_RE },
    endDate: { type: String, required: true, match: DATE_RE },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, default: '23:59', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    duration: { type: String, default: '', trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    price: { type: String, default: '', trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

/* --------------------------------- AdminUser --------------------------------- */
const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, default: 'Admin' },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

/* ------------------------------- ContactMessage ------------------------------ */
const contactMessageSchema = new Schema(
  {
    name: String,
    email: String,
    message: String,
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

module.exports = {
  Vehicle: model('Vehicle', vehicleSchema),
  VehicleImage: model('VehicleImage', vehicleImageSchema),
  TripGalleryPhoto: model('TripGalleryPhoto', tripGalleryPhotoSchema),
  Booking: model('Booking', bookingSchema),
  BookingLock: model('BookingLock', bookingLockSchema),
  Feedback: model('Feedback', feedbackSchema),
  TravelPackage: model('TravelPackage', travelPackageSchema),
  AdminUser: model('AdminUser', adminUserSchema),
  ContactMessage: model('ContactMessage', contactMessageSchema),
};
