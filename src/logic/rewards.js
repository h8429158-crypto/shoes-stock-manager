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

// Monthly reward = ₹10,000 + (consistency × ₹10,000), bounded to [10k, 20k].
export function rewardForConsistency(ratio) {
  const span = REWARD_MAX - REWARD_MIN;
  const value = REWARD_MIN + ratio * span;
  return Math.round(Math.min(REWARD_MAX, Math.max(REWARD_MIN, value)));
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
