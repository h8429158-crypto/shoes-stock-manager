import { STREAK_BONUS_DAYS, STREAK_BONUS_POINTS } from '../constants';
import { taskPoints } from './points';
import { todayStr, addDays } from './dates';

// A task is "active" on a given date if it had been created on or before that
// date and had not yet been archived (soft-deleted) by that date. This lets us
// reconstruct exactly which tasks the checklist showed on any past day.
export function isTaskActiveOn(task, dateStr) {
  if (task.created_date && task.created_date > dateStr) return false;
  if (task.archived && task.archived_date && task.archived_date <= dateStr) return false;
  return true;
}

export function activeTasksOn(tasks, dateStr) {
  return tasks.filter((t) => isTaskActiveOn(t, dateStr));
}

// Build a lookup: dateStr -> { doneIds:Set, earned:number } from raw completions.
export function indexCompletions(completions) {
  const byDate = {};
  for (const c of completions) {
    let entry = byDate[c.date];
    if (!entry) {
      entry = { doneIds: new Set(), earned: 0 };
      byDate[c.date] = entry;
    }
    entry.doneIds.add(c.task_id);
    entry.earned += c.points || 0;
  }
  return byDate;
}

// Status for a single date.
//   'green'  = every active task completed
//   'yellow' = some (but not all) completed
//   'red'    = tasks existed, none completed
//   'empty'  = no tasks were active that day
export function dayStatus(tasks, byDate, dateStr, priorityCategory) {
  const active = activeTasksOn(tasks, dateStr);
  const total = active.length;
  if (total === 0) {
    return { status: 'empty', total: 0, done: 0, possible: 0, earned: 0 };
  }
  const entry = byDate[dateStr];
  const doneIds = entry ? entry.doneIds : new Set();
  let done = 0;
  let earned = 0;
  let possible = 0;
  for (const t of active) {
    const pts = taskPoints(t, priorityCategory);
    possible += pts;
    if (doneIds.has(t.id)) {
      done += 1;
      earned += pts;
    }
  }
  let status = 'red';
  if (done === total) status = 'green';
  else if (done > 0) status = 'yellow';
  return { status, total, done, possible, earned };
}

// Earliest date we should consider for streak/history scans: the first task
// creation date, falling back to today.
function earliestDate(tasks) {
  let earliest = null;
  for (const t of tasks) {
    if (t.created_date && (!earliest || t.created_date < earliest)) {
      earliest = t.created_date;
    }
  }
  return earliest || todayStr();
}

// Walk a chronological list of dates from `start` to `end` inclusive.
function eachDate(start, end, fn) {
  let d = start;
  while (d <= end) {
    fn(d);
    d = addDays(d, 1);
  }
}

// Current streak = consecutive fully-completed days ending today. Today, if not
// yet fully done, is treated as "in progress" and does not break the streak.
// Days with no active tasks are skipped (neither extend nor break the streak).
export function currentStreak(tasks, byDate, priorityCategory, today = todayStr()) {
  let streak = 0;
  let d = today;
  const floor = earliestDate(tasks);
  while (d >= floor) {
    const { status } = dayStatus(tasks, byDate, d, priorityCategory);
    if (status === 'green') {
      streak += 1;
    } else if (status === 'empty') {
      // skip
    } else if (d === today) {
      // today still in progress — don't count, don't break
    } else {
      break;
    }
    d = addDays(d, -1);
  }
  return streak;
}

// Best (longest) run of consecutive green days across all history.
export function bestStreak(tasks, byDate, priorityCategory, today = todayStr()) {
  const floor = earliestDate(tasks);
  let best = 0;
  let run = 0;
  eachDate(floor, today, (d) => {
    const { status } = dayStatus(tasks, byDate, d, priorityCategory);
    if (status === 'green') {
      run += 1;
      if (run > best) best = run;
    } else if (status === 'empty') {
      // skip without breaking the run
    } else {
      run = 0;
    }
  });
  return best;
}

// Streak bonus earned within a month: +50 for every full 7-day run of
// completed days. Runs are counted per month independently.
export function monthStreakBonus(tasks, byDate, priorityCategory, monthKey, upToDate = todayStr()) {
  const start = `${monthKey}-01`;
  const lastPossible = `${monthKey}-31`;
  const end = upToDate < lastPossible ? upToDate : lastPossible;
  let bonus = 0;
  let run = 0;
  let d = start;
  while (d <= end) {
    if (d.slice(0, 7) !== monthKey) break;
    const { status } = dayStatus(tasks, byDate, d, priorityCategory);
    if (status === 'green') {
      run += 1;
    } else if (status === 'empty') {
      // skip
    } else {
      bonus += Math.floor(run / STREAK_BONUS_DAYS) * STREAK_BONUS_POINTS;
      run = 0;
    }
    d = addDays(d, 1);
  }
  bonus += Math.floor(run / STREAK_BONUS_DAYS) * STREAK_BONUS_POINTS;
  return bonus;
}
