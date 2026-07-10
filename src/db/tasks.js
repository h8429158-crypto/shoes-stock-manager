import { getDb } from './database';
import { todayStr } from '../logic/dates';

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

export async function addTask({ title, category = 'Other', importance = 'Low' }) {
  const db = await getDb();
  const now = new Date();
  const orderRow = await db.getFirstAsync(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM tasks',
  );
  const sortOrder = (orderRow?.maxOrder || 0) + 1;
  const res = await db.runAsync(
    `INSERT INTO tasks (title, category, importance, created_at, created_date, archived, sort_order)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    title.trim(),
    category,
    importance,
    now.toISOString(),
    todayStr(),
    sortOrder,
  );
  return res.lastInsertRowId;
}

export async function updateTask(id, { title, category, importance }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET title = ?, category = ?, importance = ? WHERE id = ?',
    title.trim(),
    category,
    importance,
    id,
  );
}

// Remove a task. If it has any completion history we soft-delete (archive) so
// past days keep rendering correctly; otherwise we hard-delete to keep things
// tidy when a task was added by mistake.
export async function deleteTask(id) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS n FROM completions WHERE task_id = ?',
    id,
  );
  const hasHistory = (row?.n || 0) > 0;
  if (hasHistory) {
    await db.runAsync(
      'UPDATE tasks SET archived = 1, archived_date = ? WHERE id = ?',
      todayStr(),
      id,
    );
  } else {
    await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
  }
}
