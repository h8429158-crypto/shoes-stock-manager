import { CATEGORIES } from '../constants';
import { addDays, toDateStr, shiftMonthKey, formatMonthKey } from './dates';

// Daily earned points across the last `days` days ending today (inclusive).
export function dailyPoints(completions, endDateStr, days = 7) {
  const byDate = {};
  for (const c of completions) {
    byDate[c.date] = (byDate[c.date] || 0) + (c.points || 0);
  }
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(endDateStr, -i);
    out.push({ date, points: byDate[date] || 0 });
  }
  return out;
}

// Earned points per month for the last `months` months ending in `endMonthKey`.
export function monthlyPoints(completions, endMonthKey, months = 6) {
  const byMonth = {};
  for (const c of completions) {
    const mk = c.date.slice(0, 7);
    byMonth[mk] = (byMonth[mk] || 0) + (c.points || 0);
  }
  const out = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const mk = shiftMonthKey(endMonthKey, -i);
    out.push({ monthKey: mk, label: formatMonthKey(mk), points: byMonth[mk] || 0 });
  }
  return out;
}

// Points earned per category within a month (uses each task's current category).
export function categoryBreakdown(completions, tasks, monthKey) {
  const categoryOf = {};
  for (const t of tasks) categoryOf[t.id] = t.category;

  const totals = {};
  for (const c of CATEGORIES) totals[c] = 0;

  for (const c of completions) {
    if (c.date.slice(0, 7) !== monthKey) continue;
    const cat = categoryOf[c.task_id] || 'Other';
    totals[cat] = (totals[cat] || 0) + (c.points || 0);
  }
  return CATEGORIES.map((cat) => ({ category: cat, points: totals[cat] || 0 }));
}

// Total lifetime earned points.
export function totalEarned(completions) {
  return completions.reduce((s, c) => s + (c.points || 0), 0);
}

export function shortWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, d).getDay()];
}

export { toDateStr };
