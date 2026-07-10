import { REWARD_MIN, REWARD_MAX } from '../constants';

// Consistency is the share of possible task points actually earned this month,
// clamped to the 0..1 range.
export function consistencyRatio(earned, possible) {
  if (!possible || possible <= 0) return 0;
  const ratio = earned / possible;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

// Per-day accrual: the reward range is split evenly across the days of the
// month. Each day is worth (max - min) / daysInMonth. A day contributes its
// full slice when every scheduled task is done, a partial slice when some are,
// and nothing when none are — but a missed day never subtracts what was already
// banked. Complete everything every day of the month to reach the maximum.
export function perDayShare(daysInMonth, min = REWARD_MIN, max = REWARD_MAX) {
  return daysInMonth > 0 ? (max - min) / daysInMonth : 0;
}

// Clamp an accrued amount into the reward range.
export function rewardFromAccrued(accrued, min = REWARD_MIN, max = REWARD_MAX) {
  return Math.round(Math.min(max, Math.max(min, min + accrued)));
}

// Format a rupee amount as ₹XX,XXX using the Indian numbering system.
export function formatRupees(amount) {
  const n = Math.round(amount || 0);
  const s = String(n);
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest},${last3}`;
}

export function formatPercent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}
