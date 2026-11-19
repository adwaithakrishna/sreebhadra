// Exercises services/availability.js against an in-memory fake of the models.
// The fake BookingLock enforces a unique (vehicle, day) key and yields between inserts so
// concurrent confirmations genuinely interleave - mirroring MongoDB's unique index behaviour.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const bookings = new Map();
const locks = new Map(); // "vehicle|day" -> booking id
let seq = 0;
const tick = () => new Promise((r) => setImmediate(r));

const query = (rows) => ({ select: () => query(rows), sort: () => query(rows), lean: async () => rows.map((r) => ({ ...r })), then: (res, rej) => Promise.resolve(rows.map((r) => ({ ...r }))).then(res, rej) });

const Booking = {
  async findById(id) { const b = bookings.get(String(id)); return b ? Object.assign({ save: async () => {} }, b, { _ref: b }) : null; },
  find(q) {
    const rows = [...bookings.values()].filter((b) =>
      String(b.vehicle) === String(q.vehicle) && b.status === q.status &&
      (!q.startDate || b.startDate <= q.startDate.$lte) && (!q.endDate || b.endDate >= q.endDate.$gte) &&
      (!q._id || String(b._id) !== String(q._id.$ne)));
    return query(rows);
  },
  async findOneAndUpdate(q, update) {
    await tick();
    const b = bookings.get(String(q._id));
    if (!b || b.status !== q.status) return null;
    b.status = update.$set.status;
    return { ...b };
  },
};
const BookingLock = {
  async insertMany(docs) {
    for (const d of docs) {
      await tick(); // let the other request interleave
      const key = `${d.vehicle}|${d.day}`;
      if (locks.has(key)) { const e = new Error('E11000 duplicate key'); e.code = 11000; throw e; }
      locks.set(key, String(d.booking));
    }
  },
  async deleteMany({ booking }) { for (const [k, v] of locks) if (v === String(booking)) locks.delete(k); },
};

const modelsPath = require.resolve(path.join(__dirname, '../src/models'));
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: { Booking, BookingLock } };
const svc = require('../src/services/availability');

const add = (startDate, endDate, status = 'pending', vehicle = 'v1') => {
  const _id = `b${++seq}`;
  bookings.set(_id, { _id, vehicle, startDate, endDate, status });
  return _id;
};
const reset = () => { bookings.clear(); locks.clear(); };

test('confirm claims a lock for every day in the range', async () => {
  reset();
  const id = add('2027-05-10', '2027-05-13');
  await svc.confirmBooking(id);
  assert.equal(bookings.get(id).status, 'confirmed');
  assert.deepEqual([...locks.keys()].sort(), ['v1|2027-05-10', 'v1|2027-05-11', 'v1|2027-05-12', 'v1|2027-05-13']);
});

test('overlap in the MIDDLE of a range is rejected (not just start date)', async () => {
  reset();
  await svc.confirmBooking(add('2027-05-12', '2027-05-12'));
  const wide = add('2027-05-10', '2027-05-15'); // starts and ends free, swallows a booked day
  await assert.rejects(() => svc.confirmBooking(wide), (e) => e.status === 409 && e.extra.availability === 'unavailable');
  assert.equal(bookings.get(wide).status, 'pending');
  assert.equal(locks.size, 1, 'no stray locks left by the failed attempt');
});

test('adjacent / different-vehicle bookings are fine', async () => {
  reset();
  await svc.confirmBooking(add('2027-05-10', '2027-05-12'));
  await svc.confirmBooking(add('2027-05-13', '2027-05-14'));
  await svc.confirmBooking(add('2027-05-10', '2027-05-12', 'pending', 'v2'));
  assert.equal([...bookings.values()].filter((b) => b.status === 'confirmed').length, 3);
});

test('two simultaneous confirmations of overlapping bookings: exactly one wins', async () => {
  for (let round = 0; round < 25; round++) {
    reset();
    const a = add('2027-06-01', '2027-06-05');
    const b = add('2027-06-04', '2027-06-08'); // overlaps a on 4th-5th
    const results = await Promise.allSettled([svc.confirmBooking(a), svc.confirmBooking(b)]);
    const won = results.filter((r) => r.status === 'fulfilled').length;
    assert.equal(won, 1, `round ${round}: expected exactly one winner`);
    const lost = results.find((r) => r.status === 'rejected');
    assert.equal(lost.reason.status, 409);
    const confirmed = [...bookings.values()].filter((x) => x.status === 'confirmed');
    assert.equal(confirmed.length, 1);
    // every lock must belong to the winner, and the loser must hold none
    const loserId = confirmed[0]._id === a ? b : a;
    assert.ok(![...locks.values()].includes(loserId), 'loser left no locks behind');
  }
});

test('non-pending bookings cannot be confirmed', async () => {
  reset();
  await assert.rejects(() => svc.confirmBooking(add('2027-07-01', '2027-07-02', 'rejected')), (e) => e.status === 409);
});

test('findConfirmedConflicts reports only confirmed overlaps', async () => {
  reset();
  add('2027-08-01', '2027-08-05', 'pending');
  add('2027-08-03', '2027-08-04', 'confirmed');
  const c = await svc.findConfirmedConflicts('v1', '2027-08-04', '2027-08-09');
  assert.equal(c.length, 1);
  assert.equal(c[0].startDate, '2027-08-03');
});
