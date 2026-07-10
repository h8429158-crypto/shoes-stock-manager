import * as SQLite from 'expo-sqlite';

const DB_NAME = 'reward_habits.db';

let dbPromise = null;

// Lazily open (and memoise) the SQLite handle using expo-sqlite's async API.
export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

// Create tables on first launch. Safe to call repeatedly.
export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      importance TEXT NOT NULL DEFAULT 'Low',
      created_at TEXT NOT NULL,
      created_date TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      archived_date TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      days TEXT NOT NULL DEFAULT 'all'
    );

    CREATE TABLE IF NOT EXISTS payouts (
      month TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      consistency REAL NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      paid INTEGER NOT NULL DEFAULT 0,
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(task_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date);
    CREATE INDEX IF NOT EXISTS idx_completions_task ON completions(task_id);

    CREATE TABLE IF NOT EXISTS priorities (
      month TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      label TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await migrate(db);
}

// Additive migrations for installs created before a column existed.
async function migrate(db) {
  const cols = await db.getAllAsync('PRAGMA table_info(tasks)');
  if (!cols.some((c) => c.name === 'days')) {
    await db.execAsync("ALTER TABLE tasks ADD COLUMN days TEXT NOT NULL DEFAULT 'all'");
  }
}

// Danger: wipe all data. Used by the "reset app" option in Settings.
export async function resetAllData() {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM completions;
    DELETE FROM tasks;
    DELETE FROM priorities;
    DELETE FROM payouts;
    DELETE FROM settings;
  `);
}
