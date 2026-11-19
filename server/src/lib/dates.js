// Pure date helpers. Dates are handled as "YYYY-MM-DD" strings (no timezone drift),
// which also compare correctly with plain string comparison.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const MAX_TRIP_DAYS = 60;

function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isValidTimeString(s) {
  return typeof s === 'string' && TIME_RE.test(s);
}

function toUTC(s) {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Inclusive number of days in the range. */
function daysInclusive(start, end) {
  return Math.round((toUTC(end) - toUTC(start)) / 86400000) + 1;
}

/** Every day from start to end inclusive, as strings. */
function enumerateDays(start, end) {
  const out = [];
  for (let t = toUTC(start); t <= toUTC(end); t += 86400000) out.push(fromUTC(t));
  return out;
}

/** Inclusive ranges overlap when each starts on/before the other ends. */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

/** "Now" in the business timezone as { date: 'YYYY-MM-DD', time: 'HH:MM' }. */
function nowInTimezone(timeZone = 'UTC', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(now)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

module.exports = {
  MAX_TRIP_DAYS,
  isValidDateString,
  isValidTimeString,
  daysInclusive,
  enumerateDays,
  rangesOverlap,
  nowInTimezone,
};
