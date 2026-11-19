// Seeds sample vehicles, bookings and the first admin user.  Usage: npm run seed
// Pass --reset to wipe vehicles/bookings first.  Admin is only created if missing.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const { Vehicle, Booking, BookingLock, AdminUser, VehicleImage } = require('./models');
const { confirmBooking } = require('./services/availability');
const { nowInTimezone } = require('./lib/dates');

const addDays = (date, n) => {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

let refCounter = 0;
const VEHICLES = [
  { name: 'Heritage Sedan', type: 'sedan', capacity: 3, luggage: 2, description: 'A quiet, comfortable saloon for airport transfers, business travel and relaxed city-to-city journeys.', amenities: ['Air conditioning', 'Phone charging', 'Bottled water', 'Wi-Fi hotspot'] },
  { name: 'Ridgeline SUV', type: 'suv', capacity: 6, luggage: 4, description: 'Higher ground clearance and generous space for family trips, hill roads and longer touring routes.', amenities: ['Air conditioning', 'Roof rails', 'Phone charging', 'First-aid kit'] },
  { name: 'Voyager Van', type: 'van', capacity: 9, luggage: 8, description: 'A spacious people-carrier with sliding doors and plenty of luggage room for small groups and families.', amenities: ['Air conditioning', 'Reclining seats', 'USB ports', 'Luggage rack'] },
  { name: 'Coastline Traveller', type: 'minibus', capacity: 16, luggage: 14, description: 'A comfortable minibus for weddings, school trips and corporate outings, with a professional driver.', amenities: ['Air conditioning', 'Sound system', 'Reclining seats', 'Under-floor luggage'] },
  { name: 'Summit Explorer', type: 'suv', capacity: 7, luggage: 5, description: 'Seven seats and sturdy suspension, suited to mountain routes and multi-day itineraries.', amenities: ['Air conditioning', 'Roof carrier', 'Phone charging', 'Emergency kit'] },
  { name: 'Grand Tourer Coach', type: 'coach', capacity: 32, luggage: 30, description: 'Full-size coach for large groups, with generous legroom, onboard storage and an experienced driver.', amenities: ['Air conditioning', 'Public address system', 'Reclining seats', 'Large luggage hold'] },
];

async function main() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([Vehicle, Booking, BookingLock, AdminUser, VehicleImage].map((m) => m.init()));

  const adminOnly = process.argv.includes('--admin-only');
  if (!adminOnly && process.argv.includes('--reset')) {
    await Promise.all([Vehicle.deleteMany(), Booking.deleteMany(), BookingLock.deleteMany(), VehicleImage.deleteMany()]);
    console.log('Cleared vehicles, bookings and locks.');
  }

  if (!adminOnly && !(await Vehicle.countDocuments())) {
    const vehicles = await Vehicle.insertMany(VEHICLES);
    const today = nowInTimezone(config.timeZone).date;
    const mk = (i, off, len, status, who, route) => ({
      reference: `WF-DEMO${++refCounter}`,
      vehicle: vehicles[i]._id,
      startLocation: route[0],
      stops: route.slice(1),
      startDate: addDays(today, off),
      endDate: addDays(today, off + len),
      startTime: '08:30',
      passengers: Math.min(vehicles[i].capacity, who.pax),
      customer: { name: who.name, phone: '+00 000 000 0000', email: who.email },
      notes: who.notes || '',
      status: 'pending',
      statusHistory: [{ status: 'pending', by: 'customer' }],
    });
    const samples = [
      [1, 6, 4, 'confirmed', { name: 'Sample Customer A', email: 'a@example.invalid', pax: 5, notes: 'Two child seats please.' }, ['Sample City A', 'Sample Hill Station', 'Sample Lake']],
      [2, 3, 2, 'confirmed', { name: 'Sample Customer B', email: 'b@example.invalid', pax: 8 }, ['Sample City B', 'Sample Coast']],
      [0, 10, 1, 'pending', { name: 'Sample Customer C', email: 'c@example.invalid', pax: 2 }, ['Sample Airport', 'Sample Old Town']],
      [3, 14, 2, 'pending', { name: 'Sample Customer D', email: 'd@example.invalid', pax: 14, notes: 'Wedding party.' }, ['Sample Town D', 'Sample Resort']],
      [4, -9, 3, 'confirmed', { name: 'Sample Customer E', email: 'e@example.invalid', pax: 6 }, ['Sample City E', 'Sample Peak']],
    ];
    for (const [i, off, len, status, who, route] of samples) {
      const b = await Booking.create(mk(i, off, len, 'pending', who, route));
      if (status === 'confirmed') await confirmBooking(b._id, 'seed');
    }
    console.log(`Seeded ${vehicles.length} vehicles and ${samples.length} sample bookings.`);
  } else if (!adminOnly) {
    console.log('Vehicles already exist - skipping sample data (use --reset to start over).');
  }

  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  if (email && password) {
    if (password.length < 10) console.warn('SEED_ADMIN_PASSWORD should be at least 10 characters - admin not created.');
    else if (!(await AdminUser.exists({ email }))) {
      await AdminUser.create({ email, passwordHash: await bcrypt.hash(password, 12), name: 'Admin' });
      console.log(`Created admin user ${email}`);
    } else console.log(`Admin ${email} already exists.`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
