import { SCHEDULE_ALL, WEEKDAY_LABELS, WEEKDAYS_ONLY } from '../constants';

export function parseDays(days) {
  if (!days || days === SCHEDULE_ALL) return [0, 1, 2, 3, 4, 5, 6];
  return String(days)
    .split(',')
    .map((n) => Number(n))
    .filter((n) => n >= 0 && n <= 6)
    .sort((a, b) => a - b);
}

export function daysToString(dayIndices) {
  const sorted = [...dayIndices].sort((a, b) => a - b);
  if (sorted.length === 7) return SCHEDULE_ALL;
  return sorted.join(',');
}

// Human-readable schedule label.
export function scheduleLabel(days) {
  if (!days || days === SCHEDULE_ALL) return 'Every day';
  if (days === WEEKDAYS_ONLY) return 'Weekdays';
  const idx = parseDays(days);
  if (idx.length === 0) return 'No days';
  if (idx.length === 2 && idx.includes(0) && idx.includes(6)) return 'Weekends';
  return idx.map((i) => WEEKDAY_LABELS[i]).join(', ');
}

// Named presets offered in the editor.
export const SCHEDULE_PRESETS = [
  { label: 'Every day', value: SCHEDULE_ALL },
  { label: 'Weekdays', value: WEEKDAYS_ONLY },
  { label: 'Custom', value: 'custom' },
];
