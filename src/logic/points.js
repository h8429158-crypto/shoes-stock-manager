import { IMPORTANCE_POINTS, PRIORITY_MULTIPLIER } from '../constants';

// Base points for a task, driven by its importance level.
export function basePoints(importance) {
  return IMPORTANCE_POINTS[importance] ?? IMPORTANCE_POINTS.Low;
}

// True if a task matches the current monthly priority category.
export function matchesPriority(task, priorityCategory) {
  return Boolean(priorityCategory) && task.category === priorityCategory;
}

// Points a single task is worth today given the active monthly priority.
// Priority-matching tasks earn double.
export function taskPoints(task, priorityCategory) {
  const base = basePoints(task.importance);
  return matchesPriority(task, priorityCategory) ? base * PRIORITY_MULTIPLIER : base;
}
