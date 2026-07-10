import { getDb } from './database';

export async function getAllPayouts() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM payouts ORDER BY month DESC');
}

export async function getPayout(month) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM payouts WHERE month = ?', month);
}

// Record (or update) a month's reward and mark it paid to yourself. Snapshots
// the amount/consistency/points at the moment you pay, so the ledger is a true
// historical record even after tasks change.
export async function markPaid(month, { amount, consistency, points }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO payouts (month, amount, consistency, points, paid, paid_at)
     VALUES (?, ?, ?, ?, 1, ?)
     ON CONFLICT(month) DO UPDATE SET
       amount = excluded.amount,
       consistency = excluded.consistency,
       points = excluded.points,
       paid = 1,
       paid_at = excluded.paid_at`,
    month,
    Math.round(amount),
    consistency,
    Math.round(points),
    new Date().toISOString(),
  );
}

export async function unmarkPaid(month) {
  const db = await getDb();
  await db.runAsync('DELETE FROM payouts WHERE month = ?', month);
}

export async function totalPaid() {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM payouts WHERE paid = 1',
  );
  return row?.total || 0;
}
