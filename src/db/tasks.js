import { getDb } from './database';
import { todayStr, currentMonthKey } from '../logic/dates';
import { isTaskLocked } from '../logic/locks';

// All tasks including archived ones — needed to reconstruct history accurately.
export async function getAllTasks() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM tasks ORDER BY sort_order ASC, id ASC');
}

// Only tasks that currently appear on the daily checklist.
export async function getActiveTasks() {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM tasks WHERE archived = 0 ORDER BY sort_order ASC, id ASC',
  );
}

export async function addTask({ title, category = 'Other', importance = 'Low', days = 'all' }) {
  const db = await getDb();
  const now = new Date();
  const orderRow = await db.getFirstAsync(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM tasks',
  );
  const sortOrder = (orderRow?.maxOrder || 0) + 1;
  const res = await db.runAsync(
    `INSERT INTO tasks (title, category, importance, created_at, created_date, archived, sort_order, days)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    title.trim(),
    category,
    importance,
    now.toISOString(),
    todayStr(),
    sortOrder,
    days,
  );
  return res.lastInsertRowId;
}

// Update a task. If the task is locked (already ticked this month), only the
// title changes — the point-affecting fields (category, importance, schedule)
// are frozen so a mid-month edit can't retroactively change the reward.
export async function updateTask(id, { title, category, importance, days }) {
  const db = await getDb();
  const completions = await db.getAllAsync(
    'SELECT task_id, date FROM completions WHERE task_id = ?',
    id,
  );
  const locked = isTaskLocked(id, completions, currentMonthKey());
  if (locked) {
    await db.runAsync('UPDATE tasks SET title = ? WHERE id = ?', title.trim(), id);
  } else {
    await db.runAsync(
      'UPDATE tasks SET title = ?, category = ?, importance = ?, days = ? WHERE id = ?',
      title.trim(),
      category,
      importance,
      days ?? 'all',
      id,
    );
  }
  return { locked };
}

// Remove a task.
//  - Locked (ticked this month): refused, to keep the reward honest. It can be
//    removed once the month rolls over.
//  - Has older history: soft-deleted (archived) so past days still render.
//  - Brand new, never ticked: hard-deleted.
export async function deleteTask(id) {
  const db = await getDb();
  const completions = await db.getAllAsync(
    'SELECT task_id, date FROM completions WHERE task_id = ?',
    id,
  );
  if (isTaskLocked(id, completions, currentMonthKey())) {
    return { deleted: false, locked: true };
  }
  if (completions.length > 0) {
    await db.runAsync(
      'UPDATE tasks SET archived = 1, archived_date = ? WHERE id = ?',
      todayStr(),
      id,
    );
  } else {
    await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
  }
  return { deleted: true, locked: false };
}
