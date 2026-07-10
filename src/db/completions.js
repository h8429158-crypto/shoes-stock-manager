import { getDb } from './database';
import { todayStr } from '../logic/dates';

export async function getAllCompletions() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM completions');
}

export async function getCompletionsForDate(date) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM completions WHERE date = ?', date);
}

// Toggle a task's completion for TODAY only. Attempting to change any other day
// throws — past days can never be edited, which prevents back-dated cheating.
// `points` is the value the task is worth right now (already priority-adjusted).
export async function toggleCompletion(taskId, date, points) {
  if (date !== todayStr()) {
    throw new Error('Only today\'s tasks can be changed.');
  }
  const db = await getDb();
  const existing = await db.getFirstAsync(
    'SELECT id FROM completions WHERE task_id = ? AND date = ?',
    taskId,
    date,
  );
  if (existing) {
    await db.runAsync('DELETE FROM completions WHERE id = ?', existing.id);
    return false;
  }
  await db.runAsync(
    'INSERT INTO completions (task_id, date, points, created_at) VALUES (?, ?, ?, ?)',
    taskId,
    date,
    points,
    new Date().toISOString(),
  );
  return true;
}
