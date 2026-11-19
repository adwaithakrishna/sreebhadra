process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const test = require('node:test');
const assert = require('node:assert/strict');
const { rangesOverlap, enumerateDays, isValidDateString, daysInclusive, nowInTimezone } = require('../src/lib/dates');
const { validateBookingInput } = require('../src/lib/validation');
const { canTransition } = require('../src/lib/status');
const { sniffImageType } = require('../src/services/storage');

test('rangesOverlap: full-range overlap rules (inclusive)', () => {
  // existing confirmed: 10th-14th
  const E = ['2027-03-10', '2027-03-14'];
  assert.equal(rangesOverlap(...E, '2027-03-12', '2027-03-12'), true, 'inside');
  assert.equal(rangesOverlap(...E, '2027-03-08', '2027-03-10'), true, 'touches first day');
  assert.equal(rangesOverlap(...E, '2027-03-14', '2027-03-16'), true, 'touches last day');
  assert.equal(rangesOverlap(...E, '2027-03-08', '2027-03-20'), true, 'request swallows existing (start date alone is free)');
  assert.equal(rangesOverlap(...E, '2027-03-05', '2027-03-09'), false, 'ends the day before');
  assert.equal(rangesOverlap(...E, '2027-03-15', '2027-03-18'), false, 'starts the day after');
});

test('enumerateDays handles month/year/leap boundaries', () => {
  assert.deepEqual(enumerateDays('2027-12-30', '2028-01-02'), ['2027-12-30', '2027-12-31', '2028-01-01', '2028-01-02']);
  assert.deepEqual(enumerateDays('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.equal(daysInclusive('2027-03-10', '2027-03-10'), 1);
});

test('date validation rejects impossible dates', () => {
  assert.equal(isValidDateString('2027-02-30'), false);
  assert.equal(isValidDateString('2027-13-01'), false);
  assert.equal(isValidDateString('27-01-01'), false);
  assert.equal(isValidDateString({ $gt: '' }), false);
  assert.equal(isValidDateString('2028-02-29'), true);
});

const NOW = new Date('2027-03-01T06:00:00Z'); // 11:30 in Asia/Kolkata
const base = () => ({
  vehicle: 'a'.repeat(24), startLocation: 'A', stops: ['B'], startDate: '2027-03-10', endDate: '2027-03-12',
  startTime: '09:00', passengers: 3, name: 'Asha Rao', phone: '+91 98765 43210', email: 'asha@example.com', notes: '',
});
const check = (over) => validateBookingInput({ ...base(), ...over }, { timeZone: 'Asia/Kolkata', now: NOW });

test('valid booking passes', () => assert.deepEqual(check({}).errors, {}));
test('end before start fails', () => assert.ok(check({ endDate: '2027-03-09' }).errors.endDate));
test('past date fails', () => assert.ok(check({ startDate: '2027-02-27', endDate: '2027-02-28' }).errors.startDate));
test('time already passed today fails; later today passes', () => {
  assert.ok(check({ startDate: '2027-03-01', endDate: '2027-03-01', startTime: '10:00' }).errors.startTime);
  assert.equal(check({ startDate: '2027-03-01', endDate: '2027-03-01', startTime: '14:00' }).errors.startTime, undefined);
});
test('needs at least one stop; blanks ignored', () => assert.ok(check({ stops: ['  ', ''] }).errors.stops));
test('bad email/phone/passengers fail', () => {
  const e = check({ email: 'nope', phone: 'abc', passengers: 0 }).errors;
  assert.ok(e.email && e.phone && e.passengers);
});
test('NoSQL-style objects are rejected', () => {
  const e = check({ vehicle: { $ne: null }, email: { $gt: '' } }).errors;
  assert.ok(e.vehicle && e.email);
});
test('trip longer than 60 days fails', () => assert.ok(check({ endDate: '2027-06-30' }).errors.endDate));

test('status transitions', () => {
  assert.equal(canTransition('pending', 'confirmed'), true);
  assert.equal(canTransition('confirmed', 'completed'), true);
  assert.equal(canTransition('rejected', 'confirmed'), false);
  assert.equal(canTransition('completed', 'cancelled'), false);
});

test('image sniffing ignores claimed type', () => {
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
  assert.equal(sniffImageType(jpg).ext, 'jpg');
  assert.equal(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
});

test('nowInTimezone returns business-local date', () => {
  assert.deepEqual(nowInTimezone('Asia/Kolkata', new Date('2027-03-01T20:00:00Z')), { date: '2027-03-02', time: '01:30' });
});
