const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const toISO = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function todayISO() {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}
export function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(s) {
  if (!s) return '';
  const d = parseISO(s);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function formatRange(a, b) {
  return a === b ? formatDate(a) : `${formatDate(a)} – ${formatDate(b)}`;
}
export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000) + 1;
export const addDaysISO = (s, n) => new Date(parseISO(s).getTime() + n * 86400000).toISOString().slice(0, 10);

export const TYPE_LABEL = { sedan: 'Sedan', suv: 'SUV', van: 'Van', minibus: 'Minibus', coach: 'Coach' };
export const routeText = (b) => [b.startLocation, ...(b.stops || [])].join(' → ');
