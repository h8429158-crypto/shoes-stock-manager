import * as SQLite from 'expo-sqlite';

/**
 * Local offline store built on expo-sqlite:
 *
 *  - `row_cache`: a generic mirror of server rows (one JSON blob per row,
 *    keyed by table + id) so every screen can render instantly from disk.
 *  - `outbox`: durable queue of mutations made while offline (or that failed
 *    in-flight); replayed in order by the sync engine when back online.
 *  - `kv`: small metadata (last sync time, etc).
 */

export type CachedTable =
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'stock_movements'
  | 'purchase_orders'
  | 'purchase_order_items'
  | 'invoices'
  | 'invoice_items'
  | 'org_members'
  | 'profiles'
  | 'orgs';

export const CACHED_TABLES: CachedTable[] = [
  'products',
  'categories',
  'suppliers',
  'stock_movements',
  'purchase_orders',
  'purchase_order_items',
  'invoices',
  'invoice_items',
  'org_members',
  'profiles',
  'orgs',
];

export type OutboxOp =
  | { kind: 'upsert'; table: CachedTable; payload: Record<string, unknown> }
  | { kind: 'insert'; table: CachedTable; payload: Record<string, unknown> }
  | { kind: 'delete'; table: CachedTable; id: string }
  | { kind: 'rpc'; fn: string; args: Record<string, unknown> };

export interface OutboxRow {
  seq: number;
  created_at: string;
  op: OutboxOp;
  attempts: number;
  last_error: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

function conn(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('stockroom.db');
    db.execSync(`
      pragma journal_mode = WAL;
      create table if not exists row_cache (
        table_name text not null,
        id text not null,
        org_id text,
        data text not null,
        primary key (table_name, id)
      );
      create index if not exists row_cache_org_idx on row_cache (table_name, org_id);
      create table if not exists outbox (
        seq integer primary key autoincrement,
        created_at text not null default (datetime('now')),
        op text not null,
        attempts integer not null default 0,
        last_error text
      );
      create table if not exists kv (
        key text primary key,
        value text not null
      );
    `);
  }
  return db;
}

export function initDb(): void {
  conn();
}

// ---------------------------------------------------------------------------
// Row cache
// ---------------------------------------------------------------------------

interface AnyRow {
  id?: string;
  org_id?: string;
  [key: string]: unknown;
}

/** org_members has a composite key; derive a stable cache id for any row. */
export function cacheIdFor(table: CachedTable, row: AnyRow): string {
  if (table === 'org_members') return `${row.org_id}:${row.user_id}`;
  return String(row.id);
}

export function cachePut(table: CachedTable, rows: AnyRow[]): void {
  if (rows.length === 0) return;
  const d = conn();
  d.withTransactionSync(() => {
    for (const row of rows) {
      d.runSync(
        `insert or replace into row_cache (table_name, id, org_id, data) values (?, ?, ?, ?)`,
        table,
        cacheIdFor(table, row),
        (row.org_id as string) ?? null,
        JSON.stringify(row)
      );
    }
  });
}

export function cacheDelete(table: CachedTable, id: string): void {
  conn().runSync(`delete from row_cache where table_name = ? and id = ?`, table, id);
}

export function cacheGetAll<T>(table: CachedTable, orgId?: string): T[] {
  const d = conn();
  const rows = orgId
    ? d.getAllSync<{ data: string }>(
        `select data from row_cache where table_name = ? and (org_id = ? or org_id is null)`,
        table,
        orgId
      )
    : d.getAllSync<{ data: string }>(`select data from row_cache where table_name = ?`, table);
  return rows.map((r) => JSON.parse(r.data) as T);
}

/** Replace the whole cached set for a table+org (used after a full refetch). */
export function cacheReplaceAll(table: CachedTable, orgId: string | null, rows: AnyRow[]): void {
  const d = conn();
  d.withTransactionSync(() => {
    if (orgId) {
      d.runSync(`delete from row_cache where table_name = ? and org_id = ?`, table, orgId);
    } else {
      d.runSync(`delete from row_cache where table_name = ?`, table);
    }
    for (const row of rows) {
      d.runSync(
        `insert or replace into row_cache (table_name, id, org_id, data) values (?, ?, ?, ?)`,
        table,
        cacheIdFor(table, row),
        (row.org_id as string) ?? null,
        JSON.stringify(row)
      );
    }
  });
}

export function cacheClearAll(): void {
  const d = conn();
  d.withTransactionSync(() => {
    d.runSync(`delete from row_cache`);
    d.runSync(`delete from outbox`);
    d.runSync(`delete from kv`);
  });
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

export function outboxAdd(op: OutboxOp): void {
  conn().runSync(`insert into outbox (op) values (?)`, JSON.stringify(op));
}

export function outboxList(limit = 100): OutboxRow[] {
  return conn()
    .getAllSync<{
      seq: number;
      created_at: string;
      op: string;
      attempts: number;
      last_error: string | null;
    }>(`select * from outbox order by seq asc limit ?`, limit)
    .map((r) => ({ ...r, op: JSON.parse(r.op) as OutboxOp }));
}

export function outboxRemove(seq: number): void {
  conn().runSync(`delete from outbox where seq = ?`, seq);
}

export function outboxMarkFailed(seq: number, error: string): void {
  conn().runSync(`update outbox set attempts = attempts + 1, last_error = ? where seq = ?`, error, seq);
}

export function outboxCount(): number {
  const row = conn().getFirstSync<{ n: number }>(`select count(*) as n from outbox`);
  return row?.n ?? 0;
}

// ---------------------------------------------------------------------------
// KV
// ---------------------------------------------------------------------------

export function kvGet(key: string): string | null {
  const row = conn().getFirstSync<{ value: string }>(`select value from kv where key = ?`, key);
  return row?.value ?? null;
}

export function kvSet(key: string, value: string): void {
  conn().runSync(`insert or replace into kv (key, value) values (?, ?)`, key, value);
}
