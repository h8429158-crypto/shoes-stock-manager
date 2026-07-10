// Local-time date helpers. All dates are stored as `YYYY-MM-DD` strings and
// months as `YYYY-MM`, always in the device's local timezone so a "day"
// matches what the user sees on their calendar.

export function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function currentMonthKey() {
  return toMonthKey(new Date());
}

export function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7);
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, delta) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function daysInMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return daysInMonth(y, m - 1);
}

export function isLastDayOfMonth(d = new Date()) {
  return d.getDate() === daysInMonth(d.getFullYear(), d.getMonth());
}

// Day of month (1-based) for a full date, or today if omitted.
export function dayOfMonth(d = new Date()) {
  return d.getDate();
}

// Weekday index (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD string.
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export function monthName(monthIndex) {
  return MONTH_NAMES[monthIndex];
}

export function formatMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// e.g. "Friday, 10 July"
export function formatLongDate(d = new Date()) {
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

// List of every YYYY-MM-DD in a month.
export function datesInMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const total = daysInMonth(y, m - 1);
  const out = [];
  for (let day = 1; day <= total; day += 1) {
    out.push(`${monthKey}-${pad2(day)}`);
  }
  return out;
}

// Weekday index (0 = Sunday) of the first day of the month.
export function firstWeekdayOfMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export function shiftMonthKey(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
}
