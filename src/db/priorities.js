import { getDb } from './database';
import { currentMonthKey } from '../logic/dates';

// The monthly priority is stored per-month. `category` is one of the task
// categories (used for the 2x point matching); `label` is the user's own words
// for the goal (e.g. "Weight Loss").
export async function getPriority(monthKey = currentMonthKey()) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM priorities WHERE month = ?', monthKey);
}

export async function setPriority(category, label = '', monthKey = currentMonthKey()) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO priorities (month, category, label) VALUES (?, ?, ?)
     ON CONFLICT(month) DO UPDATE SET category = excluded.category, label = excluded.label`,
    monthKey,
    category,
    label,
  );
}

export async function getAllPriorities() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM priorities');
}
