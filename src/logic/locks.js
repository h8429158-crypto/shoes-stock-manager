import { currentMonthKey } from './dates';

// Integrity guardrail: once a task has been ticked during the current month, its
// point-affecting fields (category, importance) are locked and it can't be
// deleted until the month rolls over. This stops mid-month edits from
// retroactively inflating the money reward. Titles can still be fixed anytime,
// and brand-new tasks can always be added (they only raise the denominator).
export function isTaskLocked(taskId, completions, monthKey = currentMonthKey()) {
  return completions.some(
    (c) => c.task_id === taskId && c.date.slice(0, 7) === monthKey,
  );
}

// Build a Set of locked task ids for quick lookup in the UI.
export function lockedTaskIds(completions, monthKey = currentMonthKey()) {
  const set = new Set();
  for (const c of completions) {
    if (c.date.slice(0, 7) === monthKey) set.add(c.task_id);
  }
  return set;
}
